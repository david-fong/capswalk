import type * as WebSocket from "ws";

import { JsUtils } from "defs/JsUtils";
import { GameEv, GroupEv, SkServer } from "defs/OnlineDefs";
import type { Game } from "game/Game";
import type { Coord } from "floor/Tile";
import type { StateChange } from "game/StateChange";
import { Player } from "game/player/Player";
import { Grid } from "floor/Grid";

import { GameManager } from "game/gameparts/GameManager";
import { RobotPlayer } from "base/game/player/RobotPlayer";

/**
 * Handles game-related events and attaches listeners to each client
 * socket.
 *
 * @final
 */
export class ServerGame<S extends Coord.System = Coord.System> extends GameManager<S> {

	public readonly sockets: Set<WebSocket>;
	private readonly _groupHostSocket: WebSocket;

	declare private readonly gameEvSocketListeners: Readonly<{[evName : string]: (...args: any[]) => void}>;
	declare private readonly _deleteExternalRefs: () => void;

	/**
	 * Entries indexed at ID's belonging to human-operated players
	 * contain an `io.Socket` object. I could have made this a field
	 * of the `Player` class, but it is only used for players of the
	 * `HUMAN` family, which is designated by field and not by class.
	 *
	 * This does not update for players that join the group while the
	 * group is already in a game, which is currently the intended
	 * behaviour: players cannot join the game mid-game.
	 */
	protected readonly playerSockets: readonly WebSocket[];

	public get currentOperator(): never {
		throw new Error("never");
	}


	/** */
	public constructor(args: Readonly<{
		sockets: Set<WebSocket>,
		groupHostSocket: WebSocket,
		deleteExternalRefs: () => void,
		gameDesc: Game.CtorArgs.UnFin<S>,
	}>) {
		super({
			impl: {
				gridClassLookup: Grid.getImplementation,
				OperatorPlayer: undefined,
				RobotPlayer: (game, desc) => RobotPlayer.of(game as GameManager<any>, desc),
				onGameBecomeOver: () => {},
			},
			desc: (() => {
				Player.CtorArgs.finalize(args.gameDesc);
				return args.gameDesc;
			})(),
			operatorIds: [],
		});
		this._groupHostSocket = args.groupHostSocket;
		Object.defineProperty(this, "_deleteExternalRefs", { value: args.deleteExternalRefs });
		JsUtils.instNoEnum (this as ServerGame<S>, "operators");
		JsUtils.propNoWrite(this as ServerGame<S>, "_groupHostSocket");

		this.sockets = new Set(args.sockets); // shallow copy
		JsUtils.propNoWrite(this as ServerGame<S>, "sockets");

		Object.defineProperty(this, "gameEvSocketListeners", { value: Object.freeze({
			[GameEv.IN_GAME]: this.processMoveRequest.bind(this),
			[GameEv.PAUSE]:   this.statusBecomePaused.bind(this),
			[GameEv.UNPAUSE]: this.statusBecomePlaying.bind(this),
		}), });

		this.sockets.forEach((s) => s.on("disconnect", () => {
			if (this.sockets.size === 1) {
				this._terminate();
			}
		}));
		// The below cast is safe because GamepartBase reassigns
		// `gameDesc.playerDescs` the result of `Player.finalize`.
		const humans = Object.freeze(
			(args.gameDesc.players).filter((player) => player.familyId === "HUMAN") as Player._CtorArgs["HUMAN"][]
		);
		this.playerSockets = humans.map((playerDesc) => playerDesc.socket!);
		JsUtils.propNoWrite(this as ServerGame<S>, "playerSockets");
		Object.seal(this); //🧊

		this._greetGameSockets(args.gameDesc, humans);
	}

	/** */
	private _greetGameSockets(gameDesc: Game.CtorArgs<S>, humans: readonly Player._CtorArgs["HUMAN"][]): void {
		Promise.all(Array.from(this.sockets, (socket) =>
			new Promise<void>((resolve) => {
				socket.once(GameEv.RESET, () => {
					resolve();
				});
			})
		)).then(() =>
			this.reset() //👂 "reset time!"
		);

		// Register socket listeners for game events:
		this.sockets.forEach((socket) => {
			socket.addEventListener("message", GameEv.RETURN_TO_LOBBY, () => {
				if (socket === this._groupHostSocket) {
					this.statusBecomeOver();
					socket.broadcast.emit(GameEv.RETURN_TO_LOBBY);
					this._terminate();
				} else {
					socket.broadcast.emit(GameEv.RETURN_TO_LOBBY, socket.id);
				}
			});
			Object.freeze(Object.entries(this.gameEvSocketListeners)).forEach(([evName, callback]) => {
				socket.addEventListener("message", evName, callback);
			});
		});

		// Pass on Game constructor arguments to each client:
		this.sockets.forEach((socket) => {
			const operatorIds = Object.freeze(humans
				.filter((desc) => desc.socket === socket)
				.map((desc) => desc.playerId));
			socket.emit(GroupEv.CREATE_GAME, gameDesc, operatorIds); //📢 "get ready for reset"
		});
	}

	/** @override */
	public async reset(): Promise<Game.ResetSer> {
		// Be ready for clients to indicate readiness to unpause.
		Promise.all(Array.from(this.sockets, (socket) =>
			new Promise<void>((resolve) => {
				socket.once(GameEv.UNPAUSE, () => { // <- clients send this upon receiving resetSer
					resolve();
				});
			})
		)).then(() => {
			this.statusBecomePlaying(); //👂 "play time!"
		});

		const resetSer = await super.reset();
		this.sockets.forEach((s) => s.emit(GameEv.RESET, resetSer)); //📢 "get ready for playing!"
		return resetSer;
	}

	/** @override */
	public setCurrentOperator(nextOperatorIndex: number): void {
		// no-op
	}


	/** @override */
	public setTimeout(callback: () => void, millis: number, ...args: any[]): number {
		return setTimeout(callback, millis, args).unref() as unknown as number;
	}

	/** @override */
	public cancelTimeout(handle: number): void {
		clearTimeout(handle as unknown as NodeJS.Timer);
	}

	/** @override */
	public statusBecomePlaying(): void {
		super.statusBecomePlaying();
		this.sockets.forEach((s) => s.send(GameEv.UNPAUSE));
	}

	/** @override */
	public statusBecomePaused(): void {
		super.statusBecomePaused();
		this.sockets.forEach((s) => s.send(GameEv.PAUSE));
	}

	/** @override */
	public commitStateChange(desc: StateChange.Res): void {
		super.commitStateChange(desc);

		if (desc.rejectId) {
			// The request was rejected- Notify the requester.
			this.playerSockets[desc.initiator]!.emit(
				GameEv.IN_GAME,
				desc,
			);
		} else {
			this.sockets.forEach((s) => s.send(JSON.stringify([GameEv.IN_GAME, desc])));
		}
	}

	private _terminate(): void {
		this.sockets.forEach((s) => {
			// TODO.impl remove listeners
		});
		this._deleteExternalRefs();
	}
}
JsUtils.protoNoEnum(ServerGame,
	"_awaitGameSockets", "_greetGameSockets",
	"setCurrentOperator", "_terminate",
);
Object.freeze(ServerGame);
Object.freeze(ServerGame.prototype);