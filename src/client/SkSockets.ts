import { JsUtils } from "defs/JsUtils";
import { Group, SkServer } from "defs/OnlineDefs";
import type { Player } from "defs/TypeDefs";

type Socket   = SocketIOClient.Socket;
type SockName = "joiner" | "group" | "game";


/**
 *
 */
export class SkSockets {

    #sock: Record<SockName, Socket | undefined>;

    // #socketIoChunk: Promise<typeof import("socket.io-client")>;

    public constructor() {
        this.#sock = {
            joiner: undefined,
            group:  undefined,
            game:   undefined,
        };
    }

    public get socketIo(): Promise<typeof import("socket.io-client")> {
        // return this.#socketIoChunk
        // || (this.#socketIoChunk = import(
        //     /* webpackChunkName: "[request]" */
        //     "socket.io-client"
        // ));
        return (() => {
            let cached: undefined | Promise<typeof import("socket.io-client")>;
            return cached || (cached = new Promise<typeof import("socket.io-client")>((resolve, reject): void => {
                const script = JsUtils.mkEl("script", []);
                script.onload = (): void => {
                    resolve(io);
                };
                script.src = (document.getElementById("socket.io-preload") as HTMLLinkElement).href;
                document.body.appendChild(script);
            }));
        })();
    }

    public get joinerSocket(): Socket | undefined { return this.#sock.joiner; }
    public get groupSocket (): Socket | undefined { return this.#sock.group;  }
    public get gameSocket  (): Socket | undefined { return this.#sock.game;   }

    /**
     * Makes the first connection to a game-hosting server.
     */
    public async joinerSocketConnect(args: { serverUrl: URL, }): Promise<Socket> {
        const manager = (await this.socketIo).Manager(args.serverUrl.toString(), {
            // https://socket.io/docs/client-api/#new-Manager-url-options
            reconnectionAttempts: Group.GameServerReconnectionAttempts,
        });
        const socket = manager.socket(SkServer.Nsps.GROUP_JOINER);
        this._registerSocket(socket, "joiner");
        return socket;
    }

    /**
     */
    public groupSocketConnect(
        groupName: Group.Name,
        query: { passphrase: Group.Passphrase, userInfo: Player.UserInfo, },
    ): Socket {
        return this._groupSocketHelper("group", groupName, query);
    }

    /**
     */
    public gameSocketConnect(
        groupName: Group.Name,
        query: { passphrase: Group.Passphrase, },
    ): Socket {
        return this._groupSocketHelper("game", groupName, query);
    }

    /**
     */
    private _groupSocketHelper(
        _category: SockName,
        groupName: Group.Name,
        query: { passphrase: Group.Passphrase, [otherKeys : string]: any },
    ): Socket {
        let nspsPrefix;
        switch (_category) {
            case "group": nspsPrefix = SkServer.Nsps.GROUP_LOBBY_PREFIX; break;
            case  "game": nspsPrefix = SkServer.Nsps.GROUP_GAME_PREFIX;  break;
            default: throw new TypeError("never"); break;
        }
        const socket = this.joinerSocket!.io
            // @ts-expect-error : Socket.IO types package is currently wrong.
            .socket(nspsPrefix + groupName, query);
        this._registerSocket(socket, _category);
        return socket;
    }

    /**
     */
    private _registerSocket(socket: Socket, name: SockName): void {
        this.#sock[name] = socket;
        const byeBye = () => {
            socket.removeAllListeners();
            socket.close();
            this.#sock[name] = undefined;
        }
        socket
        .on("connect_error", (error: object) => {
            byeBye();
        })
        .on("disconnect", (reason: string) => {
            if (reason === "io server disconnect") {
                byeBye();
            }
        });
    }
}
JsUtils.protoNoEnum(SkSockets, [
    "joinerSocketConnect", "groupSocketConnect", "gameSocketConnect",
    "_groupSocketHelper", "_registerSocket",
]);
Object.freeze(SkSockets);
Object.freeze(SkSockets.prototype);