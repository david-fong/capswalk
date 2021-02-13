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

	public readonly sockets: readonly WebSocket[] = [];
	private readonly _groupHostSocket: WebSocket;
	declare private readonly gameEvSocketListeners: Readonly<{[evName : string]: (...args: any[]) => void}>;

	private readonly _deleteExternalRefs: () => void;

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
	protected readonly playerSockets: ReadonlyMap<Player.Id, WebSocket>;

	public get currentOperator(): never {
		throw new Error("never");
	}


	/**
	 * Attach listeners for requests to each socket.
	 *
	 * Broadcasts constructor arguments to all clients.
	 */
	public constructor(args: Readonly<{
		sockets: WebSocket[],
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
		this._deleteExternalRefs = args.deleteExternalRefs;
		JsUtils.instNoEnum (this as ServerGame<S>, "operators", "_deleteExternalRefs");
		JsUtils.propNoWrite(this as ServerGame<S>, "_groupHostSocket", "_deleteExternalRefs");

		this.sockets = Object.freeze(args.sockets);
		JsUtils.propNoWrite(this as ServerGame<S>, "sockets");

		Object.defineProperty(this, "gameEvSocketListeners", { value: Object.freeze({
			[GameEv.IN_GAME]: this.processMoveRequest.bind(this),
			[GameEv.PAUSE]:   this.statusBecomePaused.bind(this),
			[GameEv.UNPAUSE]: this.statusBecomePlaying.bind(this),
		}), });

		this.sockets.forEach((s) => s.on("disconnect", () => {
			if (this.sockets.length === 1) {
				this._terminate();
			}
		}));
		this._greetGameSockets(args.gameDesc);
	}

	/**
	 */
	private _greetGameSockets(gameDesc: Game.CtorArgs<S>): void {
		// The below cast is safe because GamepartBase reassigns
		// `gameDesc.playerDescs` the result of `Player.finalize`.
		const humans = Object.freeze(
			(gameDesc.players).filter((player) => player.familyId === "HUMAN") as Player._CtorArgs["HUMAN"][]
		);
		// @ts-expect-error : RO=
		this.playerSockets
		= humans.reduce<Map<Player.Id, WebSocket>>((build, playerDesc) => {
			if (playerDesc.socket === undefined) throw new Error("never");
			build.set(playerDesc.playerId, playerDesc.socket);
			return build;
		}, new Map());
		JsUtils.propNoWrite(this as ServerGame<S>, "playerSockets");
		Object.seal(this); //🧊

		Promise.all(this.sockets.map((socket) =>
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
			socket.on(GameEv.RETURN_TO_LOBBY, () => {
				if (socket === this._groupHostSocket) {
					this.statusBecomeOver();
					socket.broadcast.emit(GameEv.RETURN_TO_LOBBY);
					this._terminate();
				} else {
					socket.broadcast.emit(GameEv.RETURN_TO_LOBBY, socket.id);
				}
			});
			Object.freeze(Object.entries(this.gameEvSocketListeners)).forEach(([evName, callback]) => {
				socket.on(evName, callback);
			});
		});

		// Pass on Game constructor arguments to each client:
		this.sockets.forEach((socket) => {
			const operatorIds = Object.freeze(humans
				.filter((desc) => desc.socket === socket)
				.map((desc) => desc.playerId));
			socket.emit(GameEv.CREATE_GAME, gameDesc, operatorIds); //📢 "get ready for reset"
		});
	}

	/** @override */
	public async reset(): Promise<Game.ResetSer> {
		const resetSer = await super.reset();

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
		this.sockets.forEach((sock) => sock.send(GameEv.UNPAUSE));
	}

	/** @override */
	public statusBecomePaused(): void {
		super.statusBecomePaused();
		this.sockets.forEach((sock) => sock.send(GameEv.PAUSE));
	}

	/** @override */
	public commitStateChange(desc: StateChange.Res): void {
		super.commitStateChange(desc);

		if (desc.rejectId) {
			// The request was rejected- Notify the requester.
			this.playerSockets.get(desc.initiator)!.emit(
				GameEv.IN_GAME,
				desc,
			);
		} else {
			// Request was accepted.
			// Pass change descriptor to all clients:
			this.sockets.forEach((sock) => sock.send(GameEv.IN_GAME, desc));
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