import * as app     from "express";
import * as http    from "http";
import * as io      from "socket.io";

import { Defs } from "src/Defs";
import { EventNames } from "src/EventNames";
import { GroupSession } from "./GroupSession";


/**
 * 
 */
class PublicNamespaces {
    public static readonly GAME_HOSTS: string       = <const>"/gamehosts";
    public static readonly GROUP_SESSIONS: string   = <const>"/groups";
}


/**
 * Creates and performs management operations on {@link ServerGame}s.
 */
export class Server {

    // TODO: do we need to make this accessible outside?
    //public static readonly PUBLIC_NAMESPACES: object = PublicNamespaces;

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

        this.io.of(PublicNamespaces.GAME_HOSTS).on("connection", this.onGameHostsConnection);
    }

    /**
     * All connections to the root are assumed to be for the purpose
     * of starting a new session for games.
     * 
     * @param socket - The socket from the game host.
     */
    protected onGameHostsConnection(socket: io.Socket): void {
        console.log("A user has connected.");

        socket.on(EventNames.CREATE_SESSION, (): void => {
            // Create a new group session:
            const namespace: io.Namespace = this.io.of(this.createUniqueSessionName());
            const newGroupSession: GroupSession = new GroupSession(namespace);

            // Notify the host of the namespace created for the
            // requested group session so they can connect to it:
            socket.emit(EventNames.CREATE_SESSION, namespace.name);
        });

        socket.on("disconnect", (...args: any[]): void => {
            ;
        });
    }

    protected createUniqueSessionName(): string {
        const sessionNum: string | number = -1; // TODO
        return `${PublicNamespaces.GROUP_SESSIONS}/${sessionNum}`;
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
        delete namespace.server.nsps[namespace.name];
    }

}
