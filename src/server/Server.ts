import * as app     from "express";
import * as http    from "http";
import * as io      from "socket.io";

import { EventNames, SocketIoNamespaces } from "src/EventNames";
import { Defs } from "src/Defs";

/**
 * Creates and performs management operations on {@link ServerGame}s.
 */
export class Server {

    protected readonly port: number;
    protected readonly hostPwd: string;

    protected readonly app:  app.Application;
    protected readonly http: http.Server;
    protected readonly io:   io.Server;

    /**
     * 
     * @param port - The port number on which to host the Server.
     *          Defaults to {@link Defs.SERVER_PORT}.
     */
    public constructor(port: number = Defs.SERVER_PORT) {
        this.port   = port;
        this.app    = app();
        this.http   = http.createServer(this.app);
        this.io     = io(this.http);
        this.hostPwd = __dirname;

        this.http.listen(this.port, (): void => {
            console.log(`Now listening on port *:${this.port}.`);
        });

        this.app.get("/", (req, res) => {
            res.sendFile(`${__dirname}/index.html`);
        });

        this.io.of(SocketIoNamespaces.GAME_HOSTS).on("connection", this.onConnection);
    }

    /**
     * All connections to the root are assumed to be for the purpose
     * of starting a new session for games.
     * 
     * @param socket - The socket from the game host.
     */
    protected onConnection(socket: io.Socket): void {
        console.log("A user has connected.");

        socket.on("disconnect", (...args: any[]): void => {
            ;
        });
    }

    protected onGameHostConnection(socket: io.Socket): void {

        this.onConnection(socket);
    }

    /**
     * 
     * @param namespace - 
     */
    private destroyNamespace(namespace: io.Namespace): void {
        if (namespace.server !== this.io) {
            throw new Error("Can only destroy namespaces under this server.");
        }
        Object.values(namespace.connected).forEach(socket => {
            socket.disconnect();
        });
        namespace.removeAllListeners();
        delete this.io.nsps[namespace.name];
    }

}
