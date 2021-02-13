import type * as WebSocket from "ws";
import { JsUtils } from "defs/JsUtils";
import { GroupEv } from "defs/OnlineDefs";

import type { Game } from "game/Game";
import type { Coord } from "floor/Tile";
import type { Player } from "game/player/Player";
import { GameManager } from "game/gameparts/GameManager";
import { ServerGame } from "./ServerGame";

import { Group as _Group, SkServer } from "defs/OnlineDefs";

/**
 * Manages communication between the server, and clients who play in
 * the same game together.
 */
export class Group extends _Group {

	// TODO.design just change this to a callback for broadcasting?
	readonly #wss: WebSocket.Server;
	public readonly name: Group.Name;
	public readonly passphrase: Group.Passphrase;

	public readonly sockets: WebSocket[] = [];
	public readonly userInfo: WeakMap<WebSocket, Player.UserInfo>;
	private _sessionHost: WebSocket;

	#currentGame: ServerGame<any> | undefined;

	declare private readonly _socketListeners: {
		readonly [evName : string]: (socket: WebSocket, ...args: any[]) => void,
	};

	private readonly _initialTtlTimeout: NodeJS.Timeout;
	private readonly _deleteExternalRefs: () => void;

	/** */
	public constructor(desc: Readonly<{
		wss: WebSocket.Server,
		name: Group.Name,
		passphrase: Group.Passphrase,
		deleteExternalRefs: () => void,
	}>) {
		super();
		this.#wss = desc.wss;
		this.name = desc.name;
		this.passphrase = desc.passphrase;
		this.#currentGame = undefined;

		this._deleteExternalRefs = desc.deleteExternalRefs;
		this._initialTtlTimeout = setTimeout(() => {
			if (this.sockets.length === 0) {
				this.terminate();
			}
		}, (Group.DEFAULT_TTL * 1000)).unref();

		Object.defineProperty(this, "_socketListeners", { value: Object.freeze({
			["disconnect"]: (socket: WebSocket): void => {
				if (socket === this._sessionHost) {
					// If the host disconnects, end the session.
					// TODO.impl this seems like a bad decision. What about just broadcasting
					// that the host player has died, and choose another player to become
					// the host?
					this.terminate();
					return;
				}
				if (this.sockets.length === 1) {
					this.terminate();
					return;
				}
				const res = <_Group.Socket.UserInfoChange.Res>{
					[this.userInfo.get(socket).guid]: undefined,
				};
				this.sockets.forEach((s) => s.send(Group.Socket.UserInfoChange.EVENT_NAME, res));
			},
			[Group.Socket.UserInfoChange.EVENT_NAME]: (socket: WebSocket, req: _Group.Socket.UserInfoChange.Req) => {
				if (typeof req.username !== "string"
				 || typeof req.teamId   !== "number"
				 || typeof req.avatar   !== "string") {
					// User arguments did not match expected format.
					console.log(`bad format: username: \`${req.username}\``
					+ `, teamId: \`${req.teamId}\`, avatar: \`${req.avatar}\`.`);
					return;
				}
				this.userInfo.set(socket, req);
				const res = <_Group.Socket.UserInfoChange.Res>{
					[socket.id]: req,
				};
				this.sockets.forEach((s) => s.send(Group.Socket.UserInfoChange.EVENT_NAME, res));
			},
		})});
	}

	/** Let someone into this group */
	public admitSocket(socket: WebSocket): void {
		console.info(`socket connect (group):  ${socket.id}`);
		if (this.#currentGame) {
			// TODO.design is there a good reason to do the below?
			// Prevent new players from joining while the group is playing
			// a game:
			socket.close();
		}
		this.userInfo.set(socket, (socket.handshake.auth as any).userInfo);
		{
			type Res = _Group.Socket.UserInfoChange.Res;
			const EVENT_NAME = Group.Socket.UserInfoChange.EVENT_NAME;
			// Notify all other clients in this group of the new player:
			// NOTE: broadcast modifier not used since socket is not yet in this.sockets.
			socket.nsp.emit(EVENT_NAME, <Res>{[socket.id]: socket.userInfo});
			// Notify the new player of all other players:
			const res: {[socketId: string]: Player.UserInfo} = {};
			this.sockets.forEach((otherSocket) => {
				res[otherSocketId] = otherSocket.userInfo;
			});
			socket.emit(EVENT_NAME, res);
		}

		/**
		 * Nobody has connected yet.
		 * The first socket becomes the session host.
		 */
		if (this.sockets.length === 0) {
			clearTimeout(this._initialTtlTimeout);
			// @ts-expect-error : RO=
			this._initialTtlTimeout = undefined!;
			this._sessionHost = socket;
			this.#wss.clients.forEach((s) => s.send(Group.Exist.EVENT_NAME, {
				[this.name]: Group.Exist.Status.IN_LOBBY,
			}));
			socket.on(GroupEv.CREATE_GAME, this._socketOnHostCreateGame.bind(this));
		}

		Object.entries(this._socketListeners).forEach(([evName, callback]) => {
			socket.on(evName, callback.bind(this, socket));
		});
		this.sockets.push(socket);
	}
	private _socketOnHostCreateGame<S extends Coord.System>(
		ctorArgs: Game.CtorArgs.UnFin<S>
	): void {
		const failureReasons = this._createGameInstance(ctorArgs);
		if (failureReasons.length) {
			// TODO.impl handle failure reasons.
			console.info(failureReasons);
		} else {
			// Broadcast to the joiner namespace of this group's change in state:
			this.#wss.clients.forEach((s) => s.send(Group.Exist.EVENT_NAME, {
				[this.name]: Group.Exist.Status.IN_GAME,
			}));
			console.info(`group ${this.name} new game`);
		}
	}

	public get isCurrentlyPlayingAGame(): boolean {
		return this.#currentGame !== undefined;
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
			socket.removeAllListeners();
		}
		if (this.#currentGame !== undefined) {
			this.#currentGame = undefined;
		}
		(this._deleteExternalRefs)();

		this.#wss.clients.forEach((s) => s.send(Group.Exist.EVENT_NAME, {
			[this.name]: Group.Exist.Status.DELETE,
		}));
		console.info(`terminated group: \`${this.name}\``);
	}



	/**
	 * Captures the properties of each client player stored with each
	 * {@link GroupSession.Socket} and repackages them for passing to
	 * the Game constructor, which will in turn pass this information
	 * to each client.
	 *
	 * @param ctorArgs
	 * The `playerDescs` field only contains descriptors for artificial
	 * players. Those for operated players are included by this method.
	 *
	 * @returns
	 * `false` if the passed arguments were incomplete or invalid.
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
			...this.sockets.map((socket) => {
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
			groupHostSocket: this._sessionHost,
			deleteExternalRefs: () => { this.#currentGame = undefined; },
			gameDesc: ctorArgs,
		});
		return [];
	}
}
export namespace Group {
	export type Name = _Group.Name;
	export type Passphrase = _Group.Passphrase;
	export namespace Query {
		export type RequestCreate = _Group.Exist.RequestCreate;
		export type NotifyStatus  = _Group.Exist.NotifyStatus;
	}
	export function isCreateRequestValid(desc: Query.RequestCreate): boolean {
		return (desc.groupName !== undefined)
		&& desc.groupName.length <= Group.Name.MaxLength
		&& Group.Name.REGEXP.test(desc.groupName)
		&& desc.passphrase.length <= Group.Passphrase.MaxLength
		&& Group.Passphrase.REGEXP.test(desc.passphrase);
	}
}
JsUtils.protoNoEnum(Group, "_socketOnHostCreateGame");
Object.freeze(Group);
Object.freeze(Group.prototype);