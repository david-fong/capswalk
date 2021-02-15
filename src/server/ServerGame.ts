import type * as WebSocket from "ws";

import { JsUtils } from "defs/JsUtils";
import { GameEv, GroupEv } from "defs/OnlineDefs";
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
 * @final
 */
export class ServerGame<S extends Coord.System = Coord.System> extends GameManager<S> {

	readonly #deleteExternalRefs: () => void;
	readonly #socketMessageCb: (ev: WebSocket.MessageEvent) => void;

	public readonly sockets: Set<WebSocket>;
	protected readonly groupHostSocket: WebSocket;
	protected readonly playerSockets: readonly WebSocket[];

	/** @override */
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
		this.sockets = new Set(args.sockets); // shallow copy
		this.groupHostSocket = args.groupHostSocket;
		this.#deleteExternalRefs = args.deleteExternalRefs
		JsUtils.instNoEnum (this as ServerGame<S>, "operators");
		JsUtils.propNoWrite(this as ServerGame<S>, "groupHostSocket", "sockets");

		// The below cast is safe because GamepartBase reassigns
		// `gameDesc.playerDescs` the result of `Player.finalize`.
		const humans = Object.freeze(
			(args.gameDesc.players).filter((player) => player.familyId === "HUMAN") as Player._CtorArgs["HUMAN"][]
		);
		this.playerSockets = humans.map((desc) => desc.socket!);
		JsUtils.propNoWrite(this as ServerGame<S>, "playerSockets");
		Object.seal(this); //🧊

		this.#socketMessageCb = (ev: WebSocket.MessageEvent): void => {
			const [evName, ...body] = JSON.parse(ev.data as string) as [string, ...any[]];
			const socket = ev.target;
			switch (evName) {
				case GameEv.IN_GAME: this.processMoveRequest(body[0]); break;
				case GameEv.PAUSE:   this.statusBecomePaused(); break;
				case GameEv.UNPAUSE: this.statusBecomePlaying(); break;
				case GameEv.RETURN_TO_LOBBY:
					if (socket === this.groupHostSocket) {
						this.statusBecomeOver();
						const data = JSON.stringify([GameEv.RETURN_TO_LOBBY]);
						this.sockets.forEach((s) => { if (s !== socket) s.send(data); });
						this._terminate();
					} else {
						const data = JSON.stringify([GameEv.RETURN_TO_LOBBY, socket.id]);
						this.sockets.forEach((s) => { if (s !== socket) s.send(data); });
					}
					break;
				default: break;
			}
		};
		this.sockets.forEach((s) => s.addEventListener("message", this.#socketMessageCb));
		this.sockets.forEach((s) => s.addEventListener("close", () => {
			if (this.sockets.size === 1) {
				this._terminate();
			}
		}));

		this._greetGameSockets(args.gameDesc, humans);
	}

	/** Helper for the constructor */
	private _greetGameSockets(gameDesc: Game.CtorArgs<S>, humans: readonly Player._CtorArgs["HUMAN"][]): void {

		// Pass on Game constructor arguments to each client:
		Promise.all(Array.from(this.sockets, (socket) =>
			new Promise<void>((resolve) => {
				socket.once(GameEv.RESET, () => {
					resolve();
				});
			})
		)).then(() =>
			this.reset() //👂 "reset time!"
		);
		this.sockets.forEach((socket) => {
			const operatorIds = Object.freeze(humans
				.filter((desc) => desc.socket === socket)
				.map((desc) => desc.playerId));
			const data = JSON.stringify([GroupEv.CREATE_GAME, gameDesc, operatorIds]);
			socket.send(data); //📢 "get ready for reset"
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
		const data = JSON.stringify([GameEv.RESET, resetSer]);
		this.sockets.forEach((s) => s.send(data)); //📢 "get ready for playing!"
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
		const data = JSON.stringify([GameEv.UNPAUSE]);
		this.sockets.forEach((s) => s.send(data));
	}

	/** @override */
	public statusBecomePaused(): void {
		super.statusBecomePaused();
		const data = JSON.stringify([GameEv.PAUSE]);
		this.sockets.forEach((s) => s.send(data));
	}

	/** @override */
	public commitStateChange(desc: StateChange.Res): void {
		super.commitStateChange(desc);

		if (desc.rejectId) {
			// The request was rejected- Notify the requester.
			const data = JSON.stringify([GameEv.IN_GAME, desc]);
			this.playerSockets[desc.initiator]!.send(data);
		} else {
			const data = JSON.stringify([GameEv.IN_GAME, desc]);
			this.sockets.forEach((s) => s.send(data));
		}
	}

	protected _terminate(): void {
		this.sockets.forEach((s) => {
			s.removeEventListener("message", this.#socketMessageCb);
		});
		this.#deleteExternalRefs();
	}
}
JsUtils.protoNoEnum(ServerGame,
	"_awaitGameSockets", "_greetGameSockets",
	"setCurrentOperator", "_terminate",
);
Object.freeze(ServerGame);
Object.freeze(ServerGame.prototype);