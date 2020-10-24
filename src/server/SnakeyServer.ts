import os       = require("os");
import path     = require("path");
import http     = require("http");
import express  = require("express");
import io       = require("socket.io");
import type * as net from "net";

import { JsUtils } from "defs/JsUtils";
import { Group } from "./Group";
import { SkServer, SkServer as _SnakeyServer } from "defs/OnlineDefs";


/**
 * Creates and performs management operations on {@link ServerGame}s.
 */
export class SnakeyServer extends _SnakeyServer {

    protected readonly http: http.Server;
    protected readonly app:  express.Application;
    protected readonly io:   io.Server;

    /**
     * This is only used to maintain object references so that they are
     * not garbage-collection eligible. Keys are Socket.IO namespace
     * names corresponding the the mapped value.
     */
    private readonly allGroups: Map<string, Group>;

    private readonly _joinerSocketListeners: Readonly<{
        [evName : string]: (this: SnakeyServer, socket: io.Socket, ...args: any[]) => void;
    }>;

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
            // Note: socket.io.js is alternatively hosted on GitHub Pages.
            origins: "*:*", // TODO.learn how can we use this?
            cookie: false, // https://github.com/socketio/socket.io/issues/2276#issuecomment-147184662
        });
        this.allGroups = new Map();
        JsUtils.propNoWrite(this as SkServer, [
            "http", "app", "io", "allGroups",
        ]);

        // At runtime, __dirname resolves to ":/dist/server/"
        const PROJECT_ROOT = path.resolve(__dirname, "../..");
        this.app.disable("x-powered-by");
        this.app.get("/", (req, res) => {
            res.sendFile(path.resolve(PROJECT_ROOT, "index.html"));
        });
        this.app.use("/dist/client", express.static(path.resolve(PROJECT_ROOT, "dist", "client")));
        this.app.use("/assets", express.static(path.resolve(PROJECT_ROOT, "assets")));

        this.http.listen(<net.ListenOptions>{ port, host }, (): void => {
            const info = <net.AddressInfo>this.http.address();
            console.log(`\n\nServer mounted to: \`${info.address}${info.port}\` using ${info.family}.\n`);
            console.log("This host can be reached at any of the following addresses:\n");
            SnakeyServer.chooseIPAddress().sort().forEach((address) => {
                console.log(/* ${SkServer.PROTOCOL} */`${address}:${port}`);
                // ^We can exclude the protocol since it will get defaulted by the client side.
            });
            console.log("");
        });

        this._joinerSocketListeners = Object.freeze({
            [Group.Exist.EVENT_NAME]: (socket: io.Socket, desc: Group.Query.RequestCreate): void => {
                // A client is requesting a new group to be created.
                // If a group with such a name already exists, or if the
                // requested name or pass-phrases don't follow the required
                // format, completely ignore the request.
                if (!(desc.groupName) || this.allGroups.has(desc.groupName)
                 ||   desc.groupName.length > Group.Name.MaxLength
                 || !(desc.groupName.match(Group.Name.REGEXP))
                 ||   desc.passphrase.length > Group.Passphrase.MaxLength
                 || !(desc.passphrase.match(Group.Passphrase.REGEXP))
                ) {
                    socket.emit(Group.Exist.EVENT_NAME, Group.Exist.RequestCreate.Response.NOPE);
                    return;
                }

                this.allGroups.set(
                    desc.groupName,
                    new Group(Object.freeze({
                        namespace:  this.io.of(SnakeyServer.Nsps.GROUP_LOBBY_PREFIX + desc.groupName),
                        name:       desc.groupName,
                        passphrase: desc.passphrase,
                        deleteExternalRefs: () => this.allGroups.delete(desc.groupName),
                        initialTtl: Group.DEFAULT_TTL,
                    })),
                );
                // Notify all sockets connected to the joiner namespace
                // of the new namespace created for the new group session:
                socket.emit(Group.Exist.EVENT_NAME, Group.Exist.RequestCreate.Response.OKAY);
            },
        });
        JsUtils.instNoEnum( this as SnakeyServer, ["_joinerSocketListeners"]);
        JsUtils.propNoWrite(this as SnakeyServer, ["_joinerSocketListeners"]);

        this.io.of(SnakeyServer.Nsps.GROUP_JOINER)
            .on("connection", this.onJoinerNspsConnection.bind(this));
    }

    /**
     * Other sockets connected to this namespace will not be notified
     * of a newly existing group until the creator of that group has
     * successfully connected to it. This allows us to know that the
     * first socket that joins that group is its creator. (Even if a
     * sneaky friend )
     *
     * @param socket - The socket from the game host.
     */
    protected onJoinerNspsConnection(socket: io.Socket): void {
        console.log(`socket    connect: ${socket.id}`);
        // Upon connection, immediately send a list of existing groups:
        socket.emit(
            Group.Exist.EVENT_NAME,
            (() => {
                // TODO.design current implementation may suffer when there are many many groups.
                const build: Group.Query.NotifyStatus = {};
                Array.from(this.allGroups).forEach(([groupName, group]) => {
                    build[groupName] = (group.isCurrentlyPlayingAGame)
                    ? Group.Exist.Status.IN_GAME
                    : Group.Exist.Status.IN_LOBBY;
                });
                return build;
            })(),
        );
        Object.entries(this._joinerSocketListeners).forEach(([evName, callback]) => {
            socket.on(evName, callback.bind(this, socket));
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
    export const chooseIPAddress = (): Array<string> => {
        return (Object.values(os.networkInterfaces()).flat() as os.NetworkInterfaceInfo[])
        .filter((info) => {
            return !(info.internal); /* && info.family === "IPv4" */
        })
        .map((info) => {
            if (info.family === "IPv6") {
                return `[${info.address}]`;
            } else {
                return info.address;
            }
        });
    };
}
Object.freeze(SnakeyServer);
Object.freeze(SnakeyServer.prototype);