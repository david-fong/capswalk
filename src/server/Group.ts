import type * as WebSocket from "ws";
import { JsUtils } from "defs/JsUtils";
import { GroupEv } from "defs/OnlineDefs";

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
	readonly #socketMessageCb: (ev: WebSocket.MessageEvent) => void;
	readonly #socketCloseCb: (ev: WebSocket.CloseEvent) => void;

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

		this.#socketMessageCb = (ev: WebSocket.MessageEvent): void => {
			const [evName, ...body] = JSON.parse(ev.data as string) as [string, ...any[]];
			switch (evName) {
				case Group.UserInfoChange.EVENT_NAME: this._socketOnUserInfoChange(ev.target, body[0]); break;
				case GroupEv.CREATE_GAME: if (ev.target === this.groupHostSocket) this._socketOnHostCreateGame(body[0]); break;
				default: break;
			}
		};
		this.#socketCloseCb = (ev: WebSocket.CloseEvent): void => {
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
				[this.userInfo.get(ev.target)!.guid]: undefined,
			}]);
			this.sockets.forEach((s) => s.send(data));
		};
	}

	/** Let someone into this group */
	public admitSocket(socket: WebSocket, userInfo: Player.UserInfo): void {
		console.info(`socket connect (group):  ${socket.id}`);
		if (this.#currentGame) {
			// TODO.design is there a good reason to do the below?
			// Prevent new players from joining while the group is playing
			// a game:
			socket.close();
		}
		this.userInfo.set(socket, userInfo);
		{
			type Res = _Group.UserInfoChange.Res;
			const EVENT_NAME = Group.UserInfoChange.EVENT_NAME;
			{
				// Notify all other clients in this group of the new player:
				// NOTE: broadcast modifier not used since socket is not yet in this.sockets.
				const data = JSON.stringify([EVENT_NAME, <Res>{[socket.id]: userInfo}]);
				this.sockets.forEach((s) => s.send(data));
			}
			// Notify the new player of all other players:
			const res: {[socketId: string]: Player.UserInfo} = {};
			this.sockets.forEach((s) => {
				res[otherSocketId] = this.userInfo.get(s);
			});
			socket.send(JSON.stringify([EVENT_NAME, res]));
		}

		/** The first socket becomes the session host. */
		if (this.sockets.size === 0) {
			clearTimeout(this.#initialTtlTimeout);
			// @ts-expect-error : RO=
			this.#initialTtlTimeout = undefined!;
			this.groupHostSocket = socket;
			this.wssBroadcast(Group.Exist.EVENT_NAME, {
				[this.name]: Group.Exist.Status.IN_LOBBY,
			});
		}
		socket.addEventListener("close", this.#socketCloseCb);
		socket.addEventListener("message", this.#socketMessageCb);
		this.sockets.add(socket);
	}

	/** */
	private _socketOnUserInfoChange(socket: WebSocket, req: _Group.UserInfoChange.Req): void {
		if (typeof req.username !== "string"
		 || typeof req.teamId   !== "number"
		 || typeof req.avatar   !== "string") {
			// User arguments did not match expected format.
			console.log(`bad format: username: \`${req.username}\``
			+ `, teamId: \`${req.teamId}\`, avatar: \`${req.avatar}\`.`);
			return;
		}
		this.userInfo.set(socket, req);
		const data = JSON.stringify([Group.UserInfoChange.EVENT_NAME, <_Group.UserInfoChange.Res>{
			[socket.id]: req,
		}]);
		this.sockets.forEach((s) => s.send(data));
	}

	/** */
	private _socketOnHostCreateGame<S extends Coord.System>(
		ctorArgs: Game.CtorArgs.UnFin<S>
	): void {
		const failureReasons = this._createGameInstance(ctorArgs);
		if (failureReasons.length) {
			// TODO.impl handle failure reasons.
			console.info(failureReasons);
		} else {
			// Broadcast to the joiner namespace of this group's change in state:
			this.wssBroadcast(Group.Exist.EVENT_NAME, {
				[this.name]: Group.Exist.Status.IN_GAME,
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
			...Array.from(this.sockets, (socket) => {
				const userInfo = this.userInfo.get(socket)!;
				return Object.freeze(<Player._CtorArgs["HUMAN"]>{
					socket:   socket,
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
		for (const socket of this.sockets) {
			socket.removeEventListener("close", this.#socketCloseCb);
			socket.removeEventListener("message", this.#socketMessageCb);
		}
		if (this.#currentGame !== undefined) {
			// TODO.design need to terminate game?
			this.#currentGame = undefined;
		}
		this.#deleteExternalRefs();

		this.wssBroadcast(Group.Exist.EVENT_NAME, {
			[this.name]: Group.Exist.Status.DELETE,
		});
		console.info(`terminated group: \`${this.name}\``);
	}
}
export namespace Group {
	export declare namespace Exist {
		export namespace Create {
			export type Req = _Group.Exist.Create.Req;
			export type Res = _Group.Exist.Create.Res;
		}
		export type NotifyStatus = _Group.Exist.NotifyStatus;
	}
	export namespace TryJoin {
		export type Req = _Group.TryJoin.Req;
	}
	export function isCreateRequestValid(desc: Exist.Create.Req): boolean {
		return (desc.groupName !== undefined)
		&& desc.groupName.length <= Group.Name.MaxLength
		&& Group.Name.REGEXP.test(desc.groupName)
		&& desc.passphrase.length <= Group.Passphrase.MaxLength
		&& Group.Passphrase.REGEXP.test(desc.passphrase);
	}
}
JsUtils.protoNoEnum(Group, "_socketOnUserInfoChange", "_socketOnHostCreateGame");
Object.freeze(Group);
Object.freeze(Group.prototype);