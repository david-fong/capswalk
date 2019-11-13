import * as app     from "express";
import * as http    from "http";
import * as io      from "socket.io";

import { Defs } from "src/Defs";
import { Events } from "src/Events";
import { GroupSession } from "src/server/GroupSession";


/**
 * 
 */
namespace PublicNamespaces {
    export const GAME_HOSTS     = "/gamehosts";
    export const GROUP_SESSIONS = "/groups"; // can address using regexp
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

    protected allGroupSessions: Map<string, GroupSession>;

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

        // This callback will only be called once.
        socket.on(Events.CreateSession.name, (ack: Function): void => {
            // Create a new group session:
            const namespace: io.Namespace = this.io.of(this.createUniqueSessionName());
            this.allGroupSessions.set(
                namespace.name,
                new GroupSession(
                    namespace,
                    Defs.GROUP_SESSION_INITIAL_TTL,
                    (): void => {
                        this.allGroupSessions.delete(namespace.name);
                    }
                )
            );

            // Notify the host of the namespace created for the
            // requested group session so they can connect to it:
            socket.emit(
                Events.CreateSession.name,
                namespace.name,
                Defs.GROUP_SESSION_INITIAL_TTL,
                (): void => {
                    // On client ack, disconnect the client.
                    socket.disconnect();
                }
            );
        });

        socket.on("disconnect", (...args: any[]): void => {
            ;
        });
    }

    protected createUniqueSessionName(): string {
        const uniqueId: string | number = -1; // TODO
        const sessionName: string = `${PublicNamespaces.GROUP_SESSIONS}/${uniqueId}`;
        if (this.allGroupSessions.has(sessionName)) {
            // should never reach here.
            throw new Error("Another session already has this name.");
        }
        return sessionName;
    }

}
