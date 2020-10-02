import * as io from "socket.io";

import type { Coord } from "floor/Tile";
import type { Player } from "game/player/Player";
import { Game } from "game/Game";
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
    private sessionHost: io.Socket;

    private readonly initialTtlTimeout: NodeJS.Timeout;
    private readonly deleteExternalRefs: VoidFunction;

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
        deleteExternalRefs: VoidFunction,
        initialTtl: number,
    }>) {
        super();
        this.namespace   = desc.namespace;
        this.passphrase  = desc.passphrase;
        this.#currentGame = undefined;

        this.initialTtlTimeout = setTimeout(() => {
            if (Object.keys(this.namespace.connected).length === 0) {
                this.terminate();
            }
        }, (desc.initialTtl * 1000)).unref();
        this.deleteExternalRefs = desc.deleteExternalRefs;

        // Call the connection-event handler:
        this.namespace.use((socket, next) => {
            const handshake = socket.handshake;
            if (handshake.query.passphrase !== this.passphrase) {
                next(new Error("Incorrect passphrase"));
            }
            return next();
        }).on("connection", this.onConnection.bind(this));
    }

    /**
     *
     * @param socket -
     */
    protected onConnection(socket: Group.Socket): void {
        console.log(`socket    connect: ${socket.id}`);
        if (this.#currentGame) {
            // TODO.design is there a good reason to do the below?
            // Prevent new players from joining while the group is playing
            // a game:
            socket.disconnect();
        }
        socket.username = "unnamed " + (Date.now()).toString();
        socket.teamId   = 0;
        socket.updateId = 0;

        // Notify all clients in this group of the new player:
        this.namespace.emit(Group.Socket.UserInfoChange.EVENT_NAME, <_Group.Socket.UserInfoChange.Res>{
            unameOld: undefined,
            unameNew: socket.username,
            teamId:   socket.teamId,
        });

        /**
         * Nobody has connected yet.
         * The first socket becomes the session host.
         */
        if (Object.keys(this.namespace.connected).length === 0) {
            clearTimeout(this.initialTtlTimeout);
            (this.initialTtlTimeout as NodeJS.Timeout) = undefined!;
            this.sessionHost = socket;
            // TODO.impl set socket.isPrivileged
            socket.broadcast.emit(Group.Exist.EVENT_NAME, {
                [this.name]: Group.Exist.Status.IN_LOBBY,
            });
            socket.on(Game.CtorArgs.EVENT_NAME, this._socketOnHostCreateGame.bind(this));
        }

        socket.on(
            Group.Socket.UserInfoChange.EVENT_NAME,
            (req: _Group.Socket.UserInfoChange.Req) => {
                if (Object.values(this.sockets).some((socket) => socket.username === req.unameNew)) {
                    // Another player already has this username. Reject the request by ignoring it:
                    return;
                }
                if (typeof req.unameNew !== "string" || typeof req.teamId !== "number") {
                    return;
                }
                const res = <_Group.Socket.UserInfoChange.Res>{
                    unameOld: socket.username,
                    unameNew: req.unameNew,
                    teamId:   req.teamId,
                };
                this.namespace.emit(Group.Socket.UserInfoChange.EVENT_NAME, res);
                socket.username = req.unameNew!;
                socket.teamId   = req.teamId;
            },
        );
        socket.on("disconnect", (...args: any[]): void => {
            if (socket === this.sessionHost) {
                // If the host disconnects, end the session.
                // TODO.impl this seems like a bad decision. What about just broadcasting
                // that the host player has died, and choose another player to become
                // the host?
                this.terminate();
                return;
            }
            if (Object.keys(this.namespace.sockets).length === 1) {
                this.terminate();
                return;
            }
            const res = <_Group.Socket.UserInfoChange.Res>{
                unameOld: socket.username,
                unameNew: undefined,
                teamId:   socket.teamId,
            };
            socket.broadcast.emit(Group.Socket.UserInfoChange.EVENT_NAME, res);
        });
    }
    private _socketOnHostCreateGame(
        ctorArgs: Game.CtorArgs<Game.Type.SERVER,Coord.System>
        | typeof Game.CtorArgs.RETURN_TO_LOBBY_INDICATOR,
    ): void {
        // First, broadcast to the joiner namespace of this
        // group's change in state:
        this.namespace.server.of(SkServer.Nsps.GROUP_JOINER).emit(Group.Exist.EVENT_NAME, {
            [this.name]: (ctorArgs !== Game.CtorArgs.RETURN_TO_LOBBY_INDICATOR)
            ? Group.Exist.Status.IN_GAME
            : Group.Exist.Status.IN_LOBBY,
        });
        if (ctorArgs !== Game.CtorArgs.RETURN_TO_LOBBY_INDICATOR) {
            const failureReasons = this._createGameInstance(ctorArgs);
            if (failureReasons) {
                // TODO.impl handle failure reasons.
            }
        } else {
            this.#currentGame!.onReturnToLobby();
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
        this.#currentGame = undefined;
        const nsps = this.namespace;
        nsps.removeAllListeners("connect");
        nsps.removeAllListeners("connection");
        Object.values(nsps.connected).forEach((socket) => {
            socket.disconnect(); // TODO.learn should we pass `true` here?
        });
        nsps.removeAllListeners();
        delete nsps.server.nsps[nsps.name];
        (this.namespace as io.Namespace) = undefined!;
        (this.deleteExternalRefs)();

        nsps.server.of(SkServer.Nsps.GROUP_JOINER).emit(Group.Exist.EVENT_NAME, {
            [this.name]: Group.Exist.Status.DELETE,
        });
        console.log(`terminated group: \`${this.name}\``);
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
        const failureReasons = GamepartManager.CHECK_VALID_CTOR_ARGS(ctorArgs);
        if (failureReasons) {
            console.log(failureReasons);
            return failureReasons;
        }
        console.log(`group ${this.name} new game`);

        // Everything needed to create a game exists. Let's do it!
        (ctorArgs.playerDescs as Player.CtorArgs.PreIdAssignment[]) = [
            ...ctorArgs.playerDescs,
            ...Object.values(this.sockets).map((socket) => {
                return Object.freeze(<Player.CtorArgs>{
                    isALocalOperator: false,
                    familyId: "HUMAN",
                    teamId:   socket.teamId,
                    socketId: socket.id,
                    username: socket.username,
                    noCheckGameOver: false, // TODO.design add a Group.Socket field for this.
                    familyArgs: {},
                });
            }),
        ];
        this.#currentGame = new ServerGame(this.namespace, ctorArgs);
        return [];
    }

    public get sockets(): Record<string, Group.Socket> {
        return this.namespace.sockets as Record<io.Socket["id"], Group.Socket>;
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
Object.freeze(Group);
Object.freeze(Group.prototype);