import * as os      from "os";
import * as http    from "http";
import * as app     from "express";
import * as io      from "socket.io";

import { Defs } from "src/Defs";
import { GroupSession } from "src/server/GroupSession";


/**
 * Creates and performs management operations on {@link ServerGame}s.
 */
export class Server {

    protected readonly http: http.Server;
    protected readonly app:  app.Application;
    protected readonly io:   io.Server;

    /**
     * This is only used to maintain object references so that they are
     * not garbage-collection elegible. Keys are Socket.IO namespace
     * names corresponding the the mapped value.
     */
    private readonly allGroupSessions: Map<string, GroupSession>;

    /**
     * 
     * @param host - The hostname of the server. This may be an IP address.
     * @param port - The port number on which to host the Server.
     *          Defaults to {@link Defs.SERVER_PORT}.
     */
    public constructor(host: string, port: number = Defs.SERVER_PORT) {
        this.app    = app();
        this.http   = http.createServer({}, this.app);
        this.io     = io(this.http);

        this.http.listen({ host, port, }, (): void => {
            console.log(`Server mounted to: ${this.http.address}.`);
        });

        this.app.get("/", (req, res) => {
            res.sendFile(`${__dirname}/../../index.html`);
        });

        this.io.of(Server.SocketIoNamespaces.GROUP_JOINER)
            .on("connection", this.onGameHostsConnection);
    }

    /**
     * All connections to the root are assumed to be for the purpose
     * of starting a new session for games.
     * 
     * @param socket - The socket from the game host.
     */
    protected onGameHostsConnection(socket: io.Socket): void {
        socket.on(GroupSession.CreateEvent.EVENT_NAME, (desc: GroupSession.CreateEvent): void => {
            // Create a new group session:
            desc.groupName = this.createUniqueSessionName(desc.groupName);
            if (!(desc.groupName)) {
                // The name was not accepted. Notify the client:
                socket.emit(
                    GroupSession.CreateEvent.EVENT_NAME,
                    new GroupSession.CreateEvent(""),
                );
                return;
            }
            const namespace: io.Namespace = this.io.of(desc.groupName);
            this.allGroupSessions.set(
                namespace.name,
                new GroupSession(
                    namespace,
                    (): void => {
                        // Once this reference is deleted, the object
                        // is elegible for garbage-collection.
                        this.allGroupSessions.delete(namespace.name);
                    },
                    desc.initialTtl,
                )
            );

            // Notify the host of the namespace created for the
            // requested group session so they can connect to it:
            socket.emit(
                GroupSession.CreateEvent.EVENT_NAME,
                desc,
            );
        });
    }

    /**
     * @returns The Socket.IO namespace using the provided `groupName`.
     * 
     * @param groupName - A name to give the group. `null` if rejected,
     *      which happens if `groupName` is already taken, or if it
     *      does not match the required regular expression.
     */
    protected createUniqueSessionName(groupName: GroupSession.SessionName): string | null {
        if (!(GroupSession.SessionName.REGEXP.test(groupName))) {
            return null;
        }
        const sessionName: string = `${Server.SocketIoNamespaces.GROUP_LOBBY}/${groupName}`;
        if (this.allGroupSessions.has(sessionName)) {
            return null;
        }
        return sessionName;
    }

}



export namespace Server {

    /**
     * Paths to pages on the site:
     */
    export const PATHS = Object.freeze(<const>{

        /**
         * A global hub where clients can join or create groups
         */
        GROUP_SESSIONS: "groups",
    });

    /**
     * 
     */
    export namespace SocketIoNamespaces {
        export const GROUP_JOINER   = "/groups";
        export const GROUP_LOBBY    = "/groups";
    }

    /**
     * @returns An array of non-internal IPv4 addresses from any of the
     * local hosts' network interfaces.
     * 
     * TODO: change to return a map from each of "public" and "private" to a list of addresses
     * https://en.wikipedia.org/wiki/Private_network
     */
    export const chooseIPv4Address = (): ReadonlyArray<string> => {
        return Object.values(os.networkInterfaces()).flat().filter((info) => {
            return !(info.internal) && info.family === "IPv4";
        }).map((info) => info.address);
    };
}
