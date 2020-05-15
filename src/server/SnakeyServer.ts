import os       = require("os");
import path     = require("path");
import http     = require("http");
import express  = require("express");
import io       = require("socket.io");
import type * as net from "net";

import { SnakeyServer as __SnakeyServer } from "defs/OnlineDefs";
import { GroupSession } from "./GroupSession";


/**
 * Creates and performs management operations on {@link ServerGame}s.
 */
export class SnakeyServer extends __SnakeyServer {

    protected readonly http: http.Server;
    protected readonly app:  express.Application;
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
    public constructor(
        port: number = SnakeyServer.DEFAULT_PORT,
        host: string | undefined = undefined,
    ) {
        super();
        this.app    = express();
        this.http   = http.createServer({}, this.app);
        this.io     = io(this.http, {
            serveClient: false,
            // Do not server socket.io-client. It is bundled into a
            // client chunk on purpose so that a client can choose to
            // fetch all static page resources from another server,
            // namely, GitHub Pages, in order to reduce the downstream
            // load on a LAN-hosted SnakeyServer.
        });
        this.allGroupSessions = new Map();

        // At runtime, __dirname resolves to ":/dist/server/"
        const PROJECT_ROOT = path.resolve(__dirname, "../..");
        this.app.disable("x-powered-by");
        this.app.get("/", (req, res) => {
            res.sendFile(path.resolve(PROJECT_ROOT, "index.html"));
        });
        this.app.use("/dist",   express.static(path.resolve(PROJECT_ROOT, "dist")));
        this.app.use("/assets", express.static(path.resolve(PROJECT_ROOT, "assets")));

        this.http.listen(<net.ListenOptions>{ port, host, }, (): void => {
            const info = <net.AddressInfo>this.http.address();
            console.log(`Server mounted to: \`${info.address}${info.port}\` using ${info.family}.`);
            console.log("");
            // TODO.impl print a list of ip addresses that clients can use to reach this server.
        });

        this.io.of(SnakeyServer.Nsps.GROUP_JOINER)
            .on("connection", this.onJoinerNspsConnection.bind(this));
    }

    /**
     * All connections to the root are assumed to be for the purpose
     * of starting a new session for games.
     *
     * @param socket - The socket from the game host.
     */
    protected onJoinerNspsConnection(socket: io.Socket): void {
        socket.emit(
            GroupSession.CtorArgs.EVENT_NAME,
            Array.from(this.allGroupSessions).map((entry) => {
                const [groupName, group] = entry;
                return (group.isCurrentlyPlayingAGame)
                    ? GroupSession.CtorArgs.LifeStage.CLOSED
                    : GroupSession.CtorArgs.LifeStage.JOINABLE;
            }),
        );
        socket.on(GroupSession.CtorArgs.EVENT_NAME, (desc: GroupSession.CtorArgs): void => {
            const groupNspsName = this.createUniqueSessionName(desc.groupName);
            if (!(groupNspsName)) {
                // The name was not accepted. Notify the client:
                socket.emit(GroupSession.CtorArgs.EVENT_NAME, undefined);
                return;
            }
            // Create a new group session:
            desc.groupName = groupNspsName;
            this.allGroupSessions.set(
                groupNspsName,
                new GroupSession(
                    this.io.of(groupNspsName), // <-- create a namespace.
                    desc,
                    () => this.allGroupSessions.delete(groupNspsName),
                    GroupSession.CtorArgs.DEFAULT_TTL,
                ),
            );
            // Notify all sockets connected to the joiner namespace
            // of the new namespace created for the new group session:
            socket.nsp.emit(GroupSession.CtorArgs.EVENT_NAME, {
                [groupNspsName]: GroupSession.CtorArgs.LifeStage.JOINABLE,
            });
        });
    }

    /**
     * @returns The Socket.IO namespace using the provided `groupName`.
     *
     * @param groupName - A name to give the group. `null` if rejected,
     *      which happens if `groupName` is already taken, or if it
     *      does not match the required regular expression.
     */
    protected createUniqueSessionName(groupName: GroupSession.GroupNspsName): string | undefined {
        if (!(GroupSession.GroupNspsName.REGEXP.test(groupName))) {
            return undefined;
        }
        const sessionName = SnakeyServer.Nsps.GROUP_LOBBY_PREFIX + groupName;
        if (this.allGroupSessions.has(sessionName)) {
            return undefined;
        }
        return sessionName;
    }
}
export namespace SnakeyServer {

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
