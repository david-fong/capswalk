import type WebSocket from "ws";
import { JsUtils } from "defs/JsUtils";
import { SOCKET_ID, JoinerEv, GroupEv } from "defs/OnlineDefs";

import type { Game } from "game/Game";
import type { Coord } from "floor/Tile";
import type { Player } from "game/player/Player";
import { GameManager } from "game/gameparts/GameManager";
import { ServerGame } from "./ServerGame";

import { Group as _Group } from "defs/OnlineDefs";

/**
 * Manages communication between the server, and clients who play in
 * the same game together.
 */
export class Group extends _Group {

	public readonly name: _Group.Name;
	public readonly passphrase: _Group.Passphrase;

	declare protected readonly wssBroadcast: (evName: string, ...data: any[]) => void;
	protected readonly sockets = new Set<WebSocket>();
	protected groupHostSocket: WebSocket;
	protected readonly userInfo = new WeakMap<WebSocket, Player.UserInfo>();

	#currentGame: ServerGame<any> | undefined;
	public get isCurrentlyPlayingAGame(): boolean {
		return this.#currentGame !== undefined;
	}

	readonly #initialTtlTimeout: NodeJS.Timeout;
	readonly #deleteExternalRefs: () => void;
	readonly #wsMessageCb: (ev: WebSocket.MessageEvent) => void;
	readonly #wsLeaveCb: (ev: WebSocket.CloseEvent) => void;

	/** */
	public constructor(args: Readonly<{
		wssBroadcast: (evName: string, ...data: any[]) => void,
		name: _Group.Name,
		passphrase: _Group.Passphrase,
		deleteExternalRefs: () => void,
	}>) {
		super();
		Object.defineProperty(this, "wssBroadcast", { value: args.wssBroadcast });
		this.name = args.name;
		this.passphrase = args.passphrase;
		JsUtils.propNoWrite(this as Group, "name", "passphrase");
		this.#currentGame = undefined;

		this.#deleteExternalRefs = args.deleteExternalRefs;
		this.#initialTtlTimeout = setTimeout(() => {
			if (this.sockets.size === 0) {
				this.terminate();
			}
		}, (Group.DEFAULT_TTL * 1000)).unref();

		this.#wsMessageCb = (ev: WebSocket.MessageEvent): void => {
			const [evName, ...args] = JSON.parse(ev.data as string) as [string, ...any[]];
			switch (evName) {
				case GroupEv.UserInfo.NAME: this._wsOnUserInfoChange(ev.target, args[0]); break;
				case GroupEv.CREATE_GAME: if (ev.target === this.groupHostSocket) this._wsOnHostCreateGame(args[0]); break;
				default: break;
			}
		};
		this.#wsLeaveCb = (ev: WebSocket.CloseEvent | WebSocket.MessageEvent): void => {
			if (ev.target === this.groupHostSocket) {
				// If the host disconnects, end the session.
				this.terminate(); // TODO.design
				return;
			}
			this.sockets.delete(ev.target);
			if (this.sockets.size === 0) {
				this.terminate();
				return;
			}
			const data = JSON.stringify([GroupEv.UserInfo.NAME, <GroupEv.UserInfo.Res>{
				[SOCKET_ID(ev.target)]: null,
			}]);
			this.sockets.forEach((s) => s.send(data));
		};
	}

	/** Let someone into this group */
	public admitSocket(ws: WebSocket, userInfo: Player.UserInfo): void {
		if (this.sockets.has(ws)) {
			return; //⚡
		}
		console.info(`socket connect (group):  ${SOCKET_ID(ws)}`);
		if (this.#currentGame) {
			// no-op
		}
		this.userInfo.set(ws, userInfo);
		{
			type Res = GroupEv.UserInfo.Res;
			const EVENT_NAME = GroupEv.UserInfo.NAME;
			{
				// Notify all other clients in this group of the new player:
				// NOTE: broadcast modifier not used since socket is not yet in this.sockets.
				const data = JSON.stringify([EVENT_NAME, <Res>{[SOCKET_ID(ws)]: userInfo}]);
				this.sockets.forEach((s) => s.send(data));
			}
			// Notify the new player of all other players:
			const res: Res = {};
			this.sockets.forEach((s) => {
				res[SOCKET_ID(s)] = this.userInfo.get(s)!;
			});
			ws.send(JSON.stringify([EVENT_NAME, res]));
		}

		/** The first socket becomes the session host. */
		if (this.sockets.size === 0) {
			clearTimeout(this.#initialTtlTimeout);
			// @ts-expect-error : RO=
			this.#initialTtlTimeout = undefined!;
			this.groupHostSocket = ws;
			this.wssBroadcast(JoinerEv.Exist.NAME, {
				[this.name]: JoinerEv.Exist.Status.IN_LOBBY,
			});
		}
		ws.addEventListener("close", this.#wsLeaveCb);
		ws.addEventListener("message", this.#wsMessageCb);
		this.sockets.add(ws);
	}

	/** Kick someone from this group. */
	public kickSocket(ws: WebSocket): boolean {
		if (this.sockets.delete(ws)) {
			ws.removeEventListener("close", this.#wsLeaveCb);
			ws.removeEventListener("message", this.#wsMessageCb);
			return true;
		}
		return false;
	}

	/** */
	private _wsOnUserInfoChange(ws: WebSocket, req: GroupEv.UserInfo.Req): void {
		if (typeof req.username !== "string"
		 || typeof req.teamId   !== "number"
		 || typeof req.avatar   !== "string") {
			// User arguments did not match expected format.
			console.log(`bad format: username: \`${req.username}\``
			+ `, teamId: \`${req.teamId}\`, avatar: \`${req.avatar}\`.`);
			return;
		}
		this.userInfo.set(ws, req);
		const data = JSON.stringify([GroupEv.UserInfo.NAME, <GroupEv.UserInfo.Res>{
			[SOCKET_ID(ws)]: req,
		}]);
		this.sockets.forEach((s) => s.send(data));
	}

	/** */
	private _wsOnHostCreateGame<S extends Coord.System>(
		ctorArgs: Game.CtorArgs.UnFin<S>
	): void {
		const failureReasons = this._createGameInstance(ctorArgs);
		if (failureReasons.length) {
			// TODO.impl handle failure reasons.
			console.info(failureReasons);
		} else {
			// Broadcast to the joiner namespace of this group's change in state:
			this.wssBroadcast(JoinerEv.Exist.NAME, {
				[this.name]: JoinerEv.Exist.Status.IN_GAME,
			});
			console.info(`group ${this.name} new game`);
		}
	}
	/**
	 * @param ctorArgs
	 * The `playerDescs` field only contains descriptors for artificial
	 * players. Those for operated players are included by this method.
	 *
	 * @returns
	 * An array of any failure reasons. Empty if none.
	 */
	private _createGameInstance<S extends Coord.System>(
		ctorArgs: Game.CtorArgs.UnFin<S>,
	): readonly string[] {
		const failureReasons = [];
		if (this.isCurrentlyPlayingAGame) {
			failureReasons.push("a game is already in session for this group");
			return failureReasons;
		}
		failureReasons.push(...GameManager.CHECK_VALID_CTOR_ARGS(ctorArgs));
		if (failureReasons.length) {
			return failureReasons;
		}
		// Everything needed to create a game exists. Let's do it!
		// @ts-expect-error : RO=
		ctorArgs.players = [
			...ctorArgs.players,
			...Array.from(this.sockets, (ws) => {
				const userInfo = this.userInfo.get(ws)!;
				return Object.freeze(<Player._CtorArgs["HUMAN"]>{
					socket:   ws,
					familyId: "HUMAN",
					username: userInfo.username,
					teamId:   userInfo.teamId,
					avatar:   userInfo.avatar,
					familyArgs: {},
				});
			}),
		];
		this.#currentGame = new ServerGame({
			sockets: this.sockets,
			groupHostSocket: this.groupHostSocket,
			deleteExternalRefs: () => { this.#currentGame = undefined; },
			gameDesc: ctorArgs,
		});
		return [];
	}

	/**
	 * - Deletes its own reference to its game (if it exists).
	 * - Disconnects each client.
	 * - Removes all listeners from this namespace.
	 * - Deletes the enclosed Socket.IO namespace from the Server.
	 * - Deletes the only external reference so this can be garbage collected.
	 */
	protected terminate(): void {
		for (const ws of this.sockets) {
			ws.removeEventListener("close", this.#wsLeaveCb);
			ws.removeEventListener("message", this.#wsMessageCb);
		}
		if (this.#currentGame !== undefined) {
			// TODO.design need to terminate game?
			this.#currentGame = undefined;
		}
		this.#deleteExternalRefs();

		this.wssBroadcast(JoinerEv.Exist.NAME, {
			[this.name]: JoinerEv.Exist.Status.DELETE,
		});
		console.info(`terminated group: \`${this.name}\``);
	}
}
JsUtils.protoNoEnum(Group, "_wsOnUserInfoChange", "_wsOnHostCreateGame");
Object.freeze(Group);
Object.freeze(Group.prototype);