import type { Player } from ":defs/TypeDefs";
import type NodeWebSocket from "ws";

/** Serverside-only. */
export function SOCKET_ID(socket: NodeWebSocket): string | never {
	// What has it got it its socketses?
	// STRING!? or NOTHING!
	if (_socketIds.has(socket)) {
		return _socketIds.get(socket)!;
	} else {
		throw new Error("never");
	}
}
export function SET_SOCKET_ID(socket: NodeWebSocket, id: string): void {
	_socketIds.set(socket, id);
}
const _socketIds = new WeakMap<NodeWebSocket, string>();


/** */
export abstract class Group { }
export namespace Group {
	export type Name = string;
	export namespace Name {
		export const REGEXP = /^(?:[a-zA-Z0-9:-]+)$/;
		export const MaxLength = 30;
	}
	export type Passphrase = string;
	export namespace Passphrase {
		export const REGEXP = /^(?:[a-zA-Z0-9:-]*)$/;
		export const MaxLength = 30;
	}
	export const GameServerReconnectionAttempts = 2;
	export const DEFAULT_TTL = 20; // seconds
}
Object.freeze(Group);
Object.freeze(Group.prototype);


/** */
export namespace JoinerEv {
	/** */
	export namespace Create {
		export const NAME = "joiner/create";
		export interface Req {
			readonly groupName: Group.Name,
			readonly passphrase: Group.Passphrase,
		}
		export type Res = boolean;
	}
	/** */
	export namespace Exist {
		export const NAME = "joiner/exist";
		/** Downstream only. */
		export type Sse = {
			readonly [groupName : string]: Status;
		};
		export const enum Status {
			IN_LOBBY = "in-lobby",
			IN_GAME  = "in-game",
			DELETE   = "delete",
		}
	}
	/** */
	export namespace TryJoin {
		export const NAME = "joiner/try-join";
		export interface Req {
			readonly groupName: Group.Name;
			readonly passphrase: Group.Passphrase;
			readonly userInfo: Player.UserInfo;
		}
		export type Res = boolean;
	}
}
Object.freeze(JoinerEv);


/** */
export namespace GroupEv {
	/** */
	export namespace UserInfo {
		export const NAME = "group/user-info-change";
		export type Req = Player.UserInfo;
		export type Res = Record<string, Player.UserInfo | null>;
	}

	/** A broadcast originating from the group host. */
	export const CREATE_GAME = "group/create-game";
}
Object.freeze(GroupEv);


/** */
export const enum GameEv {
	/**
	 * Upon constructing a _new_ game, the server waits for all clients
	 * to send this event to indicate that they have finished building
	 * any necessary HTML, and are now ready to receive the serialized
	 * reset-state.
	 */
	RESET = "game/reset",

	/**
	 * Client uses this event during reset procedure after receiving
	 * the serialized reset-state to indicate that it is ready for
	 * the game to be un-paused.
	 */
	UNPAUSE = "game/unpause",

	/** */
	PAUSE = "game/pause",

	/** */
	IN_GAME = "game/ingame",

	/**
	 * The server will send this event with no arguments to indicate
	 * that everyone must now return to the lobby, or with a socket
	 * ID as an argument to indicate that all players operated by
	 * a client with that socket ID are out of the game.
	 */
	RETURN_TO_LOBBY = "game/return-to-lobby",
}