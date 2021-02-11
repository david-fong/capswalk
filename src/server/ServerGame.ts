import type * as io from "socket.io";

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

	public readonly namespace: io.Namespace;
	private readonly _groupHostClient: io.Socket["client"];
	private readonly gameEvSocketListeners: Readonly<{[evName : string]: (...args: any[]) => void}>;

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
	protected readonly playerSockets: ReadonlyMap<Player.Id, io.Socket>;

	public get currentOperator(): never {
		throw new Error("never");
	}


	/**
	 * Attach listeners for requests to each socket.
	 *
	 * Broadcasts constructor arguments to all clients.
	 */
	public constructor(args: Readonly<{
		groupNsps: io.Namespace,
		groupHostClient: io.Socket["client"],
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
		this._groupHostClient = args.groupHostClient;
		this._deleteExternalRefs = args.deleteExternalRefs;
		JsUtils.instNoEnum (this as ServerGame<S>, "operators", "_deleteExternalRefs");
		JsUtils.propNoWrite(this as ServerGame<S>, "_groupHostClient", "_deleteExternalRefs");

		this.namespace = args.groupNsps.server.of(
			SkServer.Nsps.GROUP_GAME_PREFIX + args.groupNsps.name.replace(SkServer.Nsps.GROUP_LOBBY_PREFIX, "")
		);/* .use((socket, next) => {
			TODO.build re-enable this when we figure out how to make client send query.
			const handshake = socket.handshake;
			if (handshake.query.passphrase !== args.passphrase) {
				console.log("wrong passphrase. query was: ", handshake.query);
				next(new Error("Incorrect passphrase"));
			};
			return next();
		}) */
		JsUtils.propNoWrite(this as ServerGame<S>, "namespace");

		this.gameEvSocketListeners = Object.freeze({
			[GameEv.IN_GAME]: this.processMoveRequest.bind(this),
			[GameEv.PAUSE]:   this.statusBecomePaused.bind(this),
			[GameEv.UNPAUSE]: this.statusBecomePlaying.bind(this),
		});
		JsUtils.instNoEnum (this as ServerGame<S>, "gameEvSocketListeners");
		JsUtils.propNoWrite(this as ServerGame<S>, "gameEvSocketListeners");

		this._awaitGameSockets(Object.freeze({
			groupNsps: args.groupNsps,
			gameDesc: args.gameDesc,
		}));
	}

	/**
	 * Calls `_greetGameSockets` when all clients have joined the game
	 * namespace.
	 */
	private _awaitGameSockets(args: Readonly<{
		groupNsps: io.Namespace,
		gameDesc: Game.CtorArgs<S>,
	}>): void {
		// Prepare for all group members to join the game namespace:
		const resolvers = new Map<io.Socket["client"]["id"], () => void>();
		const promises = Array.from(args.groupNsps.sockets.values(), (groupSocket) => {
			return new Promise<void>((resolve) => {
				resolvers.set(groupSocket.client["id"], resolve);
			});
		});
		Promise.all(promises)
		.then(() => {
			this.namespace.removeAllListeners("connect");
			this._greetGameSockets(args.gameDesc); //👂 "ok! get ready for game ctor args!"
		})
		.catch((reason) => { setImmediate(() => { throw reason; }); });

		this.namespace.on("connect", (gameSocket: io.Socket): void => {
			gameSocket.on("disconnect", () => {
				if (this.namespace.sockets.size === 1) {
					this._terminate();
				}
			});
			resolvers.get(gameSocket.client["id"])!();
		});
		// Tell all group members in the lobby to join the game namespace:
		args.groupNsps.emit(GroupEv.CREATE_GAME); //📢 "join game namespace please!"
	}

	/**
	 */
	private _greetGameSockets(gameDesc: Game.CtorArgs<S>): void {
		// The below cast is safe because GamepartBase reassigns
		// `gameDesc.playerDescs` the result of `Player.finalize`.
		const humans = Object.freeze(
			(gameDesc.players).filter((player) => player.familyId === "HUMAN") as Player._CtorArgs["HUMAN"][]
		);
		const _client2GameSocket = new Map<string, io.Socket>(
			Array.from(this.namespace.sockets.values(), (sock) => [sock.client["id"], sock]),
		);
		// @ts-expect-error : RO=
		this.playerSockets
		= humans.reduce<Map<Player.Id, io.Socket>>((build, player) => {
			if (DEF.DevAssert && player.clientId === undefined) throw new Error("never");
			const gameSocket = _client2GameSocket.get(player.clientId!);
			if (DEF.DevAssert && gameSocket === undefined) throw new Error("never");
			build.set(player.playerId, gameSocket!);
			return build;
		}, new Map());
		JsUtils.propNoWrite(this as ServerGame<S>, "playerSockets");
		Object.seal(this); //🧊

		Promise.all(Array.from(this.namespace.sockets.values(), (socket) =>
			new Promise<void>((resolve) => {
				socket.once(GameEv.RESET, () => {
					resolve();
				});
			})
		)).then(() =>
			this.reset() //👂 "reset time!"
		);

		// Register socket listeners for game events:
		for (const socket of this.namespace.sockets.values()) {
			socket.on(GameEv.RETURN_TO_LOBBY, () => {
				if (socket.client === this._groupHostClient) {
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
		}

		// Pass on Game constructor arguments to each client:
		for (const socket of this.namespace.sockets.values()) {
			const operatorIds = Object.freeze(humans
				.filter((desc) => desc.clientId === socket.client["id"])
				.map((desc) => desc.playerId));
			socket.emit(GameEv.CREATE_GAME, gameDesc, operatorIds); //📢 "get ready for reset"
		}
	}

	/** @override */
	public async reset(): Promise<Game.ResetSer> {
		// Be ready for clients to indicate readiness to unpause.
		Promise.all(Array.from(this.namespace.sockets.values(), (socket) =>
			new Promise<void>((resolve) => {
				socket.once(GameEv.UNPAUSE, () => {
					resolve();
				});
			})
		)).then(() => {
			this.statusBecomePlaying(); //👂 "play time!"
		});

		const resetSer = await super.reset();

		this.namespace.emit(GameEv.RESET, resetSer); //📢 "get ready for playing!"
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
		this.namespace.emit(GameEv.UNPAUSE);
	}

	/** @override */
	public statusBecomePaused(): void {
		super.statusBecomePaused();
		this.namespace.emit(GameEv.PAUSE);
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
			this.namespace.emit(
				GameEv.IN_GAME,
				desc,
			);
		}
	}

	private _terminate(): void {
		for (const socket of this.namespace.sockets.values()) {
			socket.disconnect();
			socket.removeAllListeners();
		}
		this.namespace.removeAllListeners();
		this._deleteExternalRefs();
	}
}
JsUtils.protoNoEnum(ServerGame,
	"_awaitGameSockets", "_greetGameSockets",
	"setCurrentOperator", "_terminate",
);
Object.freeze(ServerGame);
Object.freeze(ServerGame.prototype);