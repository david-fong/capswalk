import type * as io from "socket.io";

import type { Coord } from "floor/Tile";
import type { Player } from "game/player/Player";
import { JsUtils } from "defs/JsUtils";
import { GameEv, GroupEv } from "defs/OnlineDefs";
import type { Game } from "game/Game";
import { ServerGame } from "./ServerGame";

import { Group as _Group, SkServer } from "defs/OnlineDefs";
import { GamepartManager } from "game/gameparts/GamepartManager";

export { ServerGame };


/**
 * Manages communication between the server, and clients who play in
 * the same game together.
 */
export class Group extends _Group {

    public readonly namespace: io.Namespace;
    public readonly name: Group.Name;
    public readonly passphrase: Group.Passphrase;
    #currentGame: ServerGame<Coord.System> | undefined;
    private _sessionHost: Group.Socket;

    private readonly socketListeners: Readonly<{
        [evName : string]: (socket: Group.Socket, ...args: any[]) => void,
    }>;

    private readonly _initialTtlTimeout: NodeJS.Timeout;
    private readonly _deleteExternalRefs: () => void;

    /**
     *
     * @param namespace -
     *
     * @param deleteExternalRefs
     * A function that- when called- deletes all external references
     * to this newly constructed object such that it can be garbage
     * collected.
     *
     * @param initialTtl
     * If no sockets connect to this `GameSession` in this many seconds,
     * it will close and clean itself up.
     */
    public constructor(desc: Readonly<{
        namespace: io.Namespace,
        name: Group.Name,
        passphrase: Group.Passphrase,
        deleteExternalRefs: () => void,
    }>) {
        super();
        this.namespace    = desc.namespace;
        this.name         = desc.name;
        this.passphrase   = desc.passphrase;
        this.#currentGame = undefined;

        this._deleteExternalRefs = desc.deleteExternalRefs;
        this._initialTtlTimeout = setTimeout(() => {
            if (this.namespace.sockets.size === 0) {
                this.terminate();
            }
        }, (Group.DEFAULT_TTL * 1000)).unref();

        this.socketListeners = Object.freeze({
            ["disconnect"]: (socket: io.Socket, reason): void => {
                if (socket === this._sessionHost) {
                    // If the host disconnects, end the session.
                    // TODO.impl this seems like a bad decision. What about just broadcasting
                    // that the host player has died, and choose another player to become
                    // the host?
                    this.terminate();
                    return;
                }
                if (this.namespace.sockets.size === 1) {
                    this.terminate();
                    return;
                }
                const res = <_Group.Socket.UserInfoChange.Res>{
                    [socket.id]: undefined,
                };
                socket.nsp.emit(Group.Socket.UserInfoChange.EVENT_NAME, res);
            },
            [Group.Socket.UserInfoChange.EVENT_NAME]: (socket: Group.Socket, req: _Group.Socket.UserInfoChange.Req) => {
                if (typeof req.username !== "string"
                 || typeof req.teamId   !== "number"
                 || typeof req.avatar   !== "string") {
                    // User arguments did not match expected format.
                    console.log(`bad format: username: \`${req.username}\``
                    + `, teamId: \`${req.teamId}\`, avatar: \`${req.avatar}\`.`);
                    return;
                }
                socket.userInfo = req;
                const res = <_Group.Socket.UserInfoChange.Res>{
                    [socket.id]: req,
                };
                socket.nsp.emit(Group.Socket.UserInfoChange.EVENT_NAME, res);
                //console.log("change ", res);
            },
        });
        JsUtils.instNoEnum( this as Group, ["socketListeners"]);
        JsUtils.propNoWrite(this as Group, ["socketListeners"]);

        // Call the connection-event handler:
        this.namespace.use((socket, next) => {
            const handshake = socket.handshake;
            if ((handshake.auth as any).passphrase !== this.passphrase) {
                next(new Error("Incorrect passphrase"));
            }
            const userInfo = (socket.handshake.auth as any).userInfo as Player.UserInfo;
            if (userInfo === undefined || userInfo.teamId !== 0) {
                next(new Error(`a socket attempted to connect to group`
                + ` \`${this.name}\` without providing userInfo.`));
            }
            return next();
        }).on("connection", this.onConnection.bind(this));
    }

    /**
     *
     * @param socket -
     */
    protected onConnection(socket: Group.Socket): void {
        console.info(`socket connect (group):  ${socket.id}`);
        if (this.#currentGame) {
            // TODO.design is there a good reason to do the below?
            // Prevent new players from joining while the group is playing
            // a game:
            socket.disconnect();
        }
        socket.userInfo = (socket.handshake.auth as any).userInfo;
        {
            type Res = _Group.Socket.UserInfoChange.Res;
            const EVENT_NAME = Group.Socket.UserInfoChange.EVENT_NAME;
            // Notify all other clients in this group of the new player:
            // NOTE: broadcast modifier not used since socket is not yet in this.sockets.
            socket.nsp.emit(EVENT_NAME, <Res>{[socket.id]: socket.userInfo});
            // Notify the new player of all other players:
            const res: {[socketId: string]: Player.UserInfo} = {};
            for (const [otherSocketId, otherSocket] of this.sockets.entries()) {
                res[otherSocketId] = otherSocket.userInfo;
            }
            socket.emit(EVENT_NAME, res);
        }

        /**
         * Nobody has connected yet.
         * The first socket becomes the session host.
         */
        if (socket.nsp.sockets.size === 1) {
            clearTimeout(this._initialTtlTimeout);
            // @ts-expect-error : RO=
            this._initialTtlTimeout = undefined!;
            this._sessionHost = socket;
            this.namespace.server.of(SkServer.Nsps.GROUP_JOINER).emit(Group.Exist.EVENT_NAME, {
                [this.name]: Group.Exist.Status.IN_LOBBY,
            });
            socket.on(GroupEv.CREATE_GAME, this._socketOnHostCreateGame.bind(this));
        }

        Object.entries(this.socketListeners).forEach(([evName, callback]) => {
            socket.on(evName, callback.bind(this, socket));
        });
    }
    private _socketOnHostCreateGame(
        ctorArgs: Game.CtorArgs<Game.Type.SERVER,Coord.System>
    ): void {
        const failureReasons = this._createGameInstance(ctorArgs);
        if (failureReasons.length) {
            // TODO.impl handle failure reasons.
            console.info(failureReasons);
        } else {
            // Broadcast to the joiner namespace of this group's change in state:
            this.namespace.server.of(SkServer.Nsps.GROUP_JOINER).emit(Group.Exist.EVENT_NAME, {
                [this.name]: Group.Exist.Status.IN_GAME,
            });
            console.info(`group ${this.name} new game`);
        }
    }

    public get isCurrentlyPlayingAGame(): boolean {
        return this.#currentGame !== undefined;
    }

    /**
     * - Deletes its own reference to its game (if it exists).
     * - Disconnects each client.
     * - Removes all listeners from this namespace.
     * - Deletes the enclosed Socket.IO namespace from the Server.
     * - Deletes the only external reference so this can be garbage collected.
     */
    protected terminate(): void {
        function killNamespace(nsps: io.Namespace): void {
            nsps.removeAllListeners("connect");
            nsps.removeAllListeners("connection");
            for (const socket of nsps.sockets.values()) {
                socket.disconnect(false /* Do not close underlying engine */);
                socket.removeAllListeners();
            }
            nsps.removeAllListeners();
            nsps.server._nsps.delete(nsps.name);
        }
        if (this.#currentGame !== undefined) {
            // Since `ServerGame` handles its own termination when all
            // its sockets have disconnected, this code path is unlikely.
            killNamespace(this.#currentGame.namespace);
            this.#currentGame = undefined;
        }

        const server = this.namespace.server;
        killNamespace(this.namespace);
        // @ts-expect-error : RO=
        this.namespace = undefined!;
        (this._deleteExternalRefs)();

        server.of(SkServer.Nsps.GROUP_JOINER).emit(Group.Exist.EVENT_NAME, {
            [this.name]: Group.Exist.Status.DELETE,
        });
        console.info(`terminated group: \`${this.name}\``);
    }



    /**
     * Captures the properties of each client player stored with each
     * {@link GroupSession.Socket} and repackages them for passing to
     * the Game constructor, which will in turn pass this information
     * to each client.
     *
     * @param ctorArgs
     * The `playerDescs` field only contains descriptors for artificial
     * players. Those for operated players are included by this method.
     *
     * @returns
     * `false` if the passed arguments were incomplete or invalid.
     */
    private _createGameInstance(
        ctorArgs: Game.CtorArgs<Game.Type.SERVER,Coord.System>,
    ): readonly string[] {
        const failureReasons = [];
        if (this.isCurrentlyPlayingAGame) {
            failureReasons.push("a game is already in session for this group");
            return failureReasons;
        }
        failureReasons.push(...GamepartManager.CHECK_VALID_CTOR_ARGS(ctorArgs));
        if (failureReasons.length) {
            return failureReasons;
        }

        // Everything needed to create a game exists. Let's do it!
        // @ts-expect-error : RO=
        ctorArgs.playerDescs = [
            ...ctorArgs.playerDescs,
            ...Array.from(this.sockets.values(), (socket) => {
                return Object.freeze(<Player.CtorArgs>{
                    isALocalOperator: false,
                    familyId: "HUMAN",
                    teamId:   socket.userInfo.teamId,
                    clientId: socket.client["id"],
                    username: socket.userInfo.username,
                    avatar:   socket.userInfo.avatar,
                    noCheckGameOver: false, // TODO.design add a Group.Socket field for this.
                    familyArgs: {},
                });
            }),
        ];
        this.#currentGame = new ServerGame({
            groupNsps: this.namespace,
            groupHostClient: this._sessionHost.client,
            deleteExternalRefs: () => { this.#currentGame = undefined; },
            gameDesc: ctorArgs,
        });
        return [];
    }

    public get sockets(): Map<string, Group.Socket> {
        return this.namespace.sockets as Map<io.Socket["id"], Group.Socket>;
    }
}
export namespace Group {
    export type Socket      = _Group.Socket;
    export type Name        = _Group.Name;
    export type Passphrase  = _Group.Passphrase;
    export namespace Query {
        export type RequestCreate   = _Group.Exist.RequestCreate;
        export type NotifyStatus    = _Group.Exist.NotifyStatus;
    }
}
JsUtils.protoNoEnum(Group, ["_socketOnHostCreateGame"]);
Object.freeze(Group);
Object.freeze(Group.prototype);