import { JsUtils } from "defs/JsUtils";
import { Group, SkServer } from "defs/OnlineDefs";
import type { Player } from "defs/TypeDefs";
import type * as SocketIo from "socket.io-client";
type Socket = SocketIo.Socket;
type SockName = "joiner" | "group" | "game";


/**
 *
 */
export class SkSockets {

	#sock: Record<SockName, Socket | undefined>;

	public constructor() {
		this.#sock = {
			joiner: undefined,
			group:  undefined,
			game:   undefined,
		};
	}

	public get joinerSocket(): Socket | undefined { return this.#sock.joiner; }
	public get groupSocket():  Socket | undefined { return this.#sock.group;  }
	public get gameSocket():   Socket | undefined { return this.#sock.game;   }

	/**
	 * Makes the first connection to a game-hosting server.
	 */
	public async joinerSocketConnect(args: { serverUrl: URL, }): Promise<Socket> {
		const manager = new (await SkSockets.socketIo()).Manager(args.serverUrl.toString(), {
			// https://socket.io/docs/client-api/#new-Manager-url-options
			reconnectionAttempts: Group.GameServerReconnectionAttempts,
			autoConnect: false,
			transports: ["websocket"],
		});
		const socket = manager.socket(SkServer.Nsps.GROUP_JOINER);
		this._registerSocket(socket, "joiner");
		return socket.connect();
	}

	/**
	 */
	public groupSocketConnect(
		groupName: Group.Name,
		auth: { passphrase: Group.Passphrase, userInfo: Player.UserInfo, },
	): Socket {
		return this._groupSocketHelper("group", groupName, auth).connect();
	}

	/**
	 */
	public gameSocketConnect(
		groupName: Group.Name,
		auth: { passphrase: Group.Passphrase, },
	): Socket {
		if (groupName === undefined || auth.passphrase === undefined) {
			throw new TypeError("never");
		}
		return this._groupSocketHelper("game", groupName, auth).connect();
	}

	/**
	 */
	private _groupSocketHelper(
		_category: SockName,
		groupName: Group.Name,
		auth: { passphrase: Group.Passphrase, [otherKeys : string]: any },
	): Socket {
		let nspsPrefix;
		switch (_category) {
			case "group": nspsPrefix = SkServer.Nsps.GROUP_LOBBY_PREFIX; break;
			case  "game": nspsPrefix = SkServer.Nsps.GROUP_GAME_PREFIX;  break;
			default: throw new TypeError("never");
		}
		const socket = this.joinerSocket!.io.socket(nspsPrefix + groupName, {auth});
		this._registerSocket(socket, _category);
		return socket;
	}

	/**
	 */
	private _registerSocket(socket: Socket, name: SockName): void {
		this.#sock[name] = socket;
		const byeBye = (): void => {
			socket.offAny();
			this.#sock[name] = undefined;
		};
		socket
		.on("connect_error", (error: object) => {
			console.warn(error);
			byeBye();
		})
		.on("disconnect", (reason: string) => {
			if (reason === "io server disconnect"
			 || reason === "io client disconnect") {
				console.info(reason);
				byeBye();
			}
		});
	}
}
export namespace SkSockets {
	const globalSocketIoHref = (document.getElementById("socket.io-preload") as HTMLLinkElement).href;
	let globalSocketIo: undefined | Promise<typeof SocketIo>;
	/**
	 */
	export function socketIo(): Promise<typeof SocketIo> {
		return globalSocketIo
		?? (globalSocketIo = new Promise<typeof SocketIo>((resolve, reject): void => {
			const script = JsUtils.mkEl("script", []);
			script.type = "module";
			script.onload = (): void => {
				//resolve(import(href));
				resolve((window as any).io);
			};
			script.src = globalSocketIoHref;
			document.body.appendChild(script);
		}));
	}
}
JsUtils.protoNoEnum(SkSockets, [
	"joinerSocketConnect", "groupSocketConnect", "gameSocketConnect",
	"_groupSocketHelper", "_registerSocket",
]);
Object.freeze(SkSockets);
Object.freeze(SkSockets.prototype);