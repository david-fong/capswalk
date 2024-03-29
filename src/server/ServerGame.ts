import type WebSocket from "ws";

import { JsUtils } from ":defs/JsUtils";
import { SOCKET_ID, GroupEv, GameEv } from ":defs/OnlineDefs";
import type { Game } from ":game/Game";
import type { Coord } from ":floor/Tile";
import type { StateChange } from ":game/StateChange";
import { Player } from ":game/player/Player";
import { GetRobotImpl } from ":game/player/robot/ImplBarrel";
import { GetGridImpl } from ":floor/ImplBarrel";

import { GameManager } from ":game/gameparts/GameManager";

/** @this ServerGame */
function gameOnSocketMessage<S extends Coord.System>(this: ServerGame<S>, ev: WebSocket.MessageEvent): void {
	const [evName, ...args] = JSON.parse(ev.data as string) as [string, ...any[]];
	const socket = ev.target;
	switch (evName) {
		case GameEv.IN_GAME: this.requestStateChange(args[0], socket); break;
		case GameEv.PAUSE:   this.statusBecomePaused(); break;
		case GameEv.UNPAUSE: this.statusBecomePlaying(); break;
		case GameEv.RETURN_TO_LOBBY:
			if (socket === this.groupHostSocket) {
				this.statusBecomeOver();
				const data = JSON.stringify([GameEv.RETURN_TO_LOBBY]);
				this.sockets.forEach((s) => { if (s !== socket && s.readyState === s.OPEN) { s.send(data); }});
				this._terminate();
			} else {
				const data = JSON.stringify([GameEv.RETURN_TO_LOBBY, SOCKET_ID(socket)]);
				this.sockets.forEach((s) => { if (s !== socket && s.readyState === s.OPEN) s.send(data); });
			}
			break;
		default: break;
	}
}

/**
 * Handles game-related events and attaches listeners to each client
 * socket.
 * @final
 */
export class ServerGame<S extends Coord.System = Coord.System> extends GameManager<S> {

	readonly #deleteExternalRefs: () => void;
	readonly #wsMessageCb: (ev: WebSocket.MessageEvent) => void;

	protected readonly sockets: Set<WebSocket>;
	protected readonly groupHostSocket: WebSocket;

	public override get currentClientPlayer(): never {
		throw new Error("never");
	}

	/** */
	public constructor(args: Readonly<{
		sockets: IterableIterator<WebSocket>,
		groupHostSocket: WebSocket,
		deleteExternalRefs: () => void,
		gameDesc: Game.CtorArgs.UnFin<S>,
	}>) {
		super({
			impl: {
				gridClassLookup: GetGridImpl,
				ClientPlayer: undefined,
				RobotPlayer: GetRobotImpl,
				onGameBecomeOver: () => {},
			},
			desc: (() => {
				Player.CtorArgs.finalize(args.gameDesc); // <- mutation
				return args.gameDesc;
			})(),
			clientPlayerIds: [],
		});
		this.sockets = new Set(args.sockets); // shallow copy
		this.groupHostSocket = args.groupHostSocket;
		this.#deleteExternalRefs = args.deleteExternalRefs;
		JsUtils.instNoEnum (this as ServerGame<S>, "clientPlayers");
		JsUtils.propNoWrite(this as ServerGame<S>, "sockets", "groupHostSocket");
		this.#wsMessageCb = gameOnSocketMessage.bind(this as ServerGame<any>);
		Object.seal(this); //🧊

		this.sockets.forEach((s) => {
			s.addEventListener("message", this.#wsMessageCb);
			s.addEventListener("close", () => {
				if (this.sockets.size === 1) {
					this._terminate();
				}
			}, { once: true });
		});
		this.#greetGameSockets(args.gameDesc);
	}

	/** Helper for the constructor */
	#greetGameSockets(gameDesc: Game.CtorArgs<S>): void {
		// The below cast is safe because GamepartBase reassigns
		// `gameDesc.playerDescs` the result of `Player.finalize`.
		const humans = (
			(gameDesc.players).filter((player) => player.familyId === "Human") as Player._CtorArgs["Human"][]
		).freeze();
		// Pass on Game constructor arguments to each client:
		Promise.all(Array.from(this.sockets, (s) =>
			new Promise<void>((resolve) => {
				// TODO.impl timeouts to handle edge-cases of users leaving. Also in reset().
				s.addEventListener("message", (ev) => {
					if (JSON.parse(ev.data)[0] === GameEv.RESET) {
						resolve();
					}
				}, { once: true });
			})
		).freeze()).then(() =>
			this.reset() //👂 "reset time!"
		);
		this.sockets.forEach((s) => {
			const clientPlayerIds = humans
				.filter((desc) => desc.socket === s)
				.map((desc) => desc.playerId).freeze();
			const data = JSON.stringify([GroupEv.CREATE_GAME, gameDesc, clientPlayerIds]);
			if (s.readyState === s.OPEN) { s.send(data); } //📢 "get ready for reset"
		});
	}

	public override async reset(): Promise<Game.ResetSer> {
		// Be ready for clients to indicate readiness to unpause.
		Promise.all(Array.from(this.sockets, (s) =>
			new Promise<void>((resolve) => {
				s.addEventListener("message", (ev) => {
					if (JSON.parse(ev.data)[0] === GameEv.UNPAUSE) { // <- clients send this upon receiving resetSer
						resolve();
					}
				}, { once: true });
			})
		).freeze()).then(() => {
			this.statusBecomePlaying(); //👂 "play time!"
		});

		const resetSer = await super.reset();
		const data = JSON.stringify([GameEv.RESET, resetSer]);
		this.sockets.forEach((s) => { if (s.readyState === s.OPEN) { s.send(data); }}); //📢 "get ready for playing!"
		return resetSer;
	}

	public override setCurrentClientPlayer(index: number): void {
		// no-op
	}


	public override setTimeout(callback: () => void, millis: number, ...args: any[]): number {
		return setTimeout(callback, millis, args).unref() as unknown as number;
	}

	public override cancelTimeout(handle: number): void {
		clearTimeout(handle as unknown as NodeJS.Timer);
	}

	public override statusBecomePlaying(): void {
		super.statusBecomePlaying();
		const data = JSON.stringify([GameEv.UNPAUSE]);
		this.sockets.forEach((s) => { if (s.readyState === s.OPEN) { s.send(data); }});
	}

	public override statusBecomePaused(): void {
		super.statusBecomePaused();
		const data = JSON.stringify([GameEv.PAUSE]);
		this.sockets.forEach((s) => { if (s.readyState === s.OPEN) { s.send(data); }});
	}

	public override commitStateChange(desc: StateChange.Res, authorSock?: WebSocket): void {
		super.commitStateChange(desc, authorSock);

		if (desc.rejectId) {
			// The request was rejected- Notify the requester.
			const data = JSON.stringify([GameEv.IN_GAME, desc]);
			authorSock?.send(data);
		} else {
			const data = JSON.stringify([GameEv.IN_GAME, desc]);
			this.sockets.forEach((s) => { if (s.readyState === s.OPEN) { s.send(data); }});
		}
	}

	protected _terminate(): void {
		this.sockets.forEach((s) => {
			s.removeEventListener("message", this.#wsMessageCb);
		});
		this.#deleteExternalRefs();
	}
}
JsUtils.protoNoEnum(ServerGame,
	"setCurrentClientPlayer", "_terminate",
);
Object.freeze(ServerGame);
Object.freeze(ServerGame.prototype);