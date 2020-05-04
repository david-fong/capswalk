import os   = require("os");
import path = require("path");
import http = require("http");
import app  = require("express");
import io   = require("socket.io");

import { SnakeyNsps } from "defs/TypeDefs";

import { GroupSession } from "./GroupSession";


/**
 * Creates and performs management operations on {@link ServerGame}s.
 */
export class SnakeyServer {

    protected readonly http: http.Server;
    protected readonly app:  app.Application;
    protected readonly io:   io.Server;

    /**
     * This is only used to maintain object references so that they are
     * not garbage-collection eligible. Keys are Socket.IO namespace
     * names corresponding the the mapped value.
     */
    private readonly allGroupSessions: Map<string, GroupSession>;

    /**
     *
     * @param host - The hostname of the server. This may be an IP address.
     * @param port - The port number on which to host the Server.
     *          Defaults to {@link Defs.SERVER_PORT}.
     */
    public constructor(host: string, port: number = SnakeyServer.DEFAULT_PORT) {
        this.app    = app();
        this.http   = http.createServer({}, this.app);
        this.io     = io(this.http);

        this.http.listen({ host, port,}, (): void => {
            console.log(`Server mounted to: ${this.http.address}.`);
        });

        this.app.get("/", (req, res) => {
            res.sendFile(path.resolve(__dirname, "..", "index.html"));
        });

        this.io.of(SnakeyNsps.HOST_REGISTRATION)
            .on("connection", this.onHostsConnection.bind(this));
    }

    /**
     * All connections to the root are assumed to be for the purpose
     * of starting a new session for games.
     *
     * @param socket - The socket from the game host.
     */
    protected onHostsConnection(socket: io.Socket): void {
        socket.on(GroupSession.CtorArgs.EVENT_NAME, (desc: GroupSession.CtorArgs): void => {
            // Create a new group session:
            const groupName = this.createUniqueSessionName(desc.groupName);
            if (!(groupName)) {
                // The name was not accepted. Notify the client:
                socket.emit(
                    GroupSession.CtorArgs.EVENT_NAME,
                    new GroupSession.CtorArgs(""),
                );
                return;
            }
            desc.groupName = groupName;
            const namespace: io.Namespace = this.io.of(groupName);
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
                GroupSession.CtorArgs.EVENT_NAME,
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
    protected createUniqueSessionName(groupName: GroupSession.SessionName): string | undefined {
        if (!(GroupSession.SessionName.REGEXP.test(groupName))) {
            return undefined;
        }
        const sessionName: string = `${SnakeyNsps.GROUP_PREFIX}/${groupName}`;
        if (this.allGroupSessions.has(sessionName)) {
            return undefined;
        }
        return sessionName;
    }
}
export namespace SnakeyServer {

    export const DEFAULT_PORT = <const>8080;

    /**
     * @returns An array of non-internal IPv4 addresses from any of the
     * local hosts' network interfaces.
     *
     * TODO: change to return a map from each of "public" and "private" to a list of addresses
     * https://en.wikipedia.org/wiki/Private_network
     */
    export const chooseIPv4Address = (): TU.RoArr<string> => {
        return Object.values(os.networkInterfaces()).flat().filter((info) => {
            return !(info.internal) && info.family === "IPv4";
        }).map((info) => info.address);
    };
}
Object.freeze(SnakeyServer);
Object.freeze(SnakeyServer.prototype);
