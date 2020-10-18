import { JsUtils } from "defs/JsUtils";

type Socket   = SocketIOClient.Socket;
type SioOpts  = SocketIOClient.ConnectOpts;
type SockProm = Promise<Socket>;
type SockName = "joiner" | "group" | "game";


/**
 *
 */
export class SkSockets {

    #sock: Record<SockName, Socket | undefined>;

    // #socketIoChunk: Promise<typeof import("socket.io-client")>;

    public constructor() {
        ;
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
                const script = document.createElement("script");
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

    public async setJoinerSocket(url: string, params: SioOpts): SockProm { return await this._mkSocket("joiner", url, params) }
    public async setGroupSocket (url: string, params: SioOpts): SockProm { return await this._mkSocket("group",  url, params) }
    public async setGameSocket  (url: string, params: SioOpts): SockProm { return await this._mkSocket("game",   url, params) }

    private async _mkSocket(name: SockName, url: string, params: SioOpts): SockProm {
        const socket = (await this.socketIo)(url, params);
        this._configSocket(socket, name);
        return socket;
    }
    public _configSocket(socket: Socket, name: SockName): void {
        this.#sock[name] = socket;
        socket
        .on("connect_error", (error: object) => {
            socket.removeAllListeners();
            socket.close();
            this.#sock[name] = undefined;
        })
        .on("disconnect", (reason: string) => {
            if (reason === "io server disconnect") {
                socket.removeAllListeners();
                socket.close();
                this.#sock[name] = undefined;
            }
        });
    }
}
JsUtils.protoNoEnum(SkSockets, [
    "setJoinerSocket", "setGroupSocket", "setGameSocket", "_mkSocket",
]);
Object.freeze(SkSockets);
Object.freeze(SkSockets.prototype);