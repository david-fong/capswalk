import type * as WebSocket from "ws";
import { JsUtils } from "defs/JsUtils";
import { SOCKET_ID, JoinerEv, GameEv } from "defs/OnlineDefs";

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
	protected readonly userInfo: WeakMap<WebSocket, Player.UserInfo>;

	#currentGame: ServerGame<any> | undefined;
	public get isCurrentlyPlayingAGame(): boolean {
		return this.#currentGame !== undefined;
	}

	readonly #initialTtlTimeout: NodeJS.Timeout;
	readonly #deleteExternalRefs: () => void;
	readonly #wsMessageCb: (ev: WebSocket.MessageEvent) => void;
	readonly #wsCloseCb: (ev: WebSocket.CloseEvent) => void;

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
				case Group.UserInfoChange.EVENT_NAME: this._wsOnUserInfoChange(ev.target, args[0]); break;
				case GameEv.CREATE_GAME: if (ev.target === this.groupHostSocket) this._wsOnHostCreateGame(args[0]); break;
				default: break;
			}
		};
		this.#wsCloseCb = (ev: WebSocket.CloseEvent): void => {
			if (ev.target === this.groupHostSocket) {
				// If the host disconnects, end the session.
				// TODO.impl this seems like a bad decision. What about just broadcasting
				// that the host player has died, and choose another player to become
				// the host?
				this.terminate();
				return;
			}
			this.sockets.delete(ev.target);
			if (this.sockets.size === 0) {
				this.terminate();
				return;
			}
			const data = JSON.stringify([Group.UserInfoChange.EVENT_NAME, <_Group.UserInfoChange.Res>{
				[SOCKET_ID(ev.target)]: undefined,
			}]);
			this.sockets.forEach((s) => s.send(data));
		};
	}

	/** Let someone into this group */
	public admitSocket(ws: WebSocket, userInfo: Player.UserInfo): void {
		console.info(`socket connect (group):  ${SOCKET_ID(ws)}`);
		if (this.#currentGame) {
			// TODO.design is there a good reason to do the below?
			// Prevent new players from joining while the group is playing
			// a game:
			ws.close();
		}
		this.userInfo.set(ws, userInfo);
		{
			type Res = _Group.UserInfoChange.Res;
			const EVENT_NAME = Group.UserInfoChange.EVENT_NAME;
			{
				// Notify all other clients in this group of the new player:
				// NOTE: broadcast modifier not used since socket is not yet in this.sockets.
				const data = JSON.stringify([EVENT_NAME, <Res>{[SOCKET_ID(ws)]: userInfo}]);
				this.sockets.forEach((s) => s.send(data));
			}
			// Notify the new player of all other players:
			const res: {[socketId: string]: Player.UserInfo} = {};
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
		ws.addEventListener("close", this.#wsCloseCb);
		ws.addEventListener("message", this.#wsMessageCb);
		this.sockets.add(ws);
	}

	/** */
	private _wsOnUserInfoChange(ws: WebSocket, req: _Group.UserInfoChange.Req): void {
		if (typeof req.username !== "string"
		 || typeof req.teamId   !== "number"
		 || typeof req.avatar   !== "string") {
			// User arguments did not match expected format.
			console.log(`bad format: username: \`${req.username}\``
			+ `, teamId: \`${req.teamId}\`, avatar: \`${req.avatar}\`.`);
			return;
		}
		this.userInfo.set(ws, req);
		const data = JSON.stringify([Group.UserInfoChange.EVENT_NAME, <_Group.UserInfoChange.Res>{
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
			ws.removeEventListener("close", this.#wsCloseCb);
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
export namespace Group {
	export function isCreateRequestValid(desc: JoinerEv.Create.Req): boolean {
		return (desc.groupName !== undefined)
		&& desc.groupName.length <= Group.Name.MaxLength
		&& Group.Name.REGEXP.test(desc.groupName)
		&& desc.passphrase.length <= Group.Passphrase.MaxLength
		&& Group.Passphrase.REGEXP.test(desc.passphrase);
	}
}
JsUtils.protoNoEnum(Group, "_wsOnUserInfoChange", "_wsOnHostCreateGame");
Object.freeze(Group);
Object.freeze(Group.prototype);