import os       = require("os");
import path     = require("path");
import http     = require("http");
import express  = require("express");
import io       = require("socket.io");
import type * as net from "net";

import { Group } from "./Group";
import { SkServer as __SnakeyServer } from "defs/OnlineDefs";


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
    private readonly allGroups: Map<string, Group>;

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
        this.allGroups = new Map();

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
            console.log(`Server mounted to: \`${info.address}${info.port}\` using ${info.family}.\n`);
            console.log("This host can be reached at any of the following addresses:");
            SnakeyServer.chooseIPAddress().forEach((address) => {
                console.log(`- ${address}`);
            });
            console.log("");
        });

        this.io.of(SnakeyServer.Nsps.GROUP_JOINER)
            .on("connection", this.onJoinerNspsConnection.bind(this));
    }

    /**
     * Other sockets connected to this namespace will not be notified
     * of a newly existing group until the creator of that group has
     * successfully connected to it. This simplifies the implementation
     * of ensuring that we can assume that lsjdhfaklsdjhflaskdhf
     *
     * @param socket - The socket from the game host.
     */
    protected onJoinerNspsConnection(socket: io.Socket): void {
        console.log(`socket \`${socket.id}\` connected.`);
        // Upon connection, immediately send a list of existing groups:
        socket.emit(
            Group.Exist.EVENT_NAME,
            (() => {
                const build: Group.Query.NotifyStatus = {};
                Array.from(this.allGroups).map((entry) => {
                    const [groupName, group,] = entry;
                    build[groupName] = (group.isCurrentlyPlayingAGame)
                    ? Group.Exist.Status.IN_GAME
                    : Group.Exist.Status.IN_LOBBY;
                });
                return build;
            })(),
        );
        socket.on(Group.Exist.EVENT_NAME, (desc: Group.Query.RequestCreate): void => {
            // A client is requesting a new group to be created.
            // If a group with such a name already exists, or if the
            // requested name or pass-phrases don't follow the required
            // format, completely ignore the request.
            if (!desc.groupName || this.allGroups.has(desc.groupName)
            ||  desc.groupName.length > Group.Name.MaxLength
            || !desc.groupName.match(Group.Name.REGEXP)
            ||  desc.passphrase.length > Group.Passphrase.MaxLength
            || !desc.passphrase.match(Group.Passphrase.REGEXP)
            ) {
                socket.emit(Group.Exist.EVENT_NAME, Group.Exist.RequestCreate.Response.NOPE);
            }

            this.allGroups.set(
                desc.groupName,
                new Group(
                    this.io.of(SnakeyServer.Nsps.GROUP_LOBBY_PREFIX + desc.groupName), // <-- create a namespace.
                    desc.passphrase,
                    () => this.allGroups.delete(desc.groupName),
                    Group.DEFAULT_TTL,
                ),
            );
            // Notify all sockets connected to the joiner namespace
            // of the new namespace created for the new group session:
            socket.emit(Group.Exist.EVENT_NAME, Group.Exist.RequestCreate.Response.OKAY);
            // TODO.impl don't notify others until the creator has joined.
            socket.broadcast.emit(Group.Exist.EVENT_NAME, {
                [desc.groupName]: Group.Exist.Status.IN_LOBBY,
            });
        });
    }
}
export namespace SnakeyServer {

    /**
     * @returns An array of non-internal IP addresses from any of the
     * local host's network interfaces.
     *
     * TODO: change to return a map from each of "public" and "private" to a list of addresses
     * https://en.wikipedia.org/wiki/Private_network
     */
    export const chooseIPAddress = (): TU.RoArr<string> => {
        return (Object.values(os.networkInterfaces()).flat() as os.NetworkInterfaceInfo[])
        .filter((info) => {
            return !(info.internal) /* && info.family === "IPv4" */;
        }).map((info) => info.address);
    };
}
Object.freeze(SnakeyServer);
Object.freeze(SnakeyServer.prototype);
