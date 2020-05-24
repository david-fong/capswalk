import * as io from "socket.io";

import { Game } from "game/Game";
import { ServerGame } from "./ServerGame";
import type { Player } from "game/player/Player";

import { Group as __Group } from "defs/OnlineDefs";

export { ServerGame } from "./ServerGame";


/**
 * Manages communication between the server, and clients who play in
 * the same game together.
 */
export class Group extends __Group {

    public readonly namespace: io.Namespace;
    public readonly name: Group.Name;
    public readonly passphrase: Group.Passphrase;
    #currentGame: ServerGame<any> | undefined;
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
        socket.username = undefined;
        socket.teamId   = undefined;
        socket.updateId = 0;

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
            socket.on(Game.CtorArgs.EVENT_NAME, (ctorArgs: Game.CtorArgs<Game.Type.SERVER,any>) => {
                this.createGameInstance(ctorArgs);
            });
        }

        socket.on("disconnect", (...args: any[]): void => {
            if (socket === this.sessionHost) {
                // If the host disconnects, end the session.
                // TODO.impl this seems like a bad decision. What about just broadcasting
                // that the host player has died, and choose another player to become
                // the host?
                this.terminate();
            }
            if (Object.keys(this.namespace.sockets).length === 1) {
                this.terminate();
            }
        });
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
        console.log(`terminated group: \`${this.name}\``);
    }



    /**
     * Captures the properties of each client player stored with each
     * {@link GroupSession.Socket} and repackages them for passing to
     * the Game constructor, which will in turn pass this information
     * to each client.
     *
     * @param coordSys -
     * @param gridDimensions -
     * @returns false if the passed arguments were incomplete or invalid.
     */
    private createGameInstance(
        ctorArgs: Game.CtorArgs<Game.Type.SERVER,any>,
    ): Readonly<Game.CtorArgs.FailureReasons> | undefined {
        const failureReasons: Game.CtorArgs.FailureReasons = {
            undefinedUsername: Object.values(this.sockets)
                .filter((socket) => !socket.username)
                .map((socket) => socket.id),
            undefinedTeamId: Object.values(this.sockets)
                .filter((socket) => !socket.teamId)
                .map((socket) => socket.id),
        };
        if (failureReasons.undefinedUsername.length ||
            failureReasons.undefinedTeamId.length) {
            return failureReasons;
        }
        // Everything needed to create a game exists. Let's do it!
        (ctorArgs.playerDescs as Player.CtorArgs.PreIdAssignment[]) = [
            ...ctorArgs.playerDescs,
            ...Object.values(this.sockets).map((socket) => {
                return Object.freeze(<Player.CtorArgs>{
                    isALocalOperator: false,
                    familyId: "HUMAN",
                    teamId: socket.teamId!,
                    socketId: socket.id,
                    username: socket.username!, // checked above.
                    noCheckGameOver: false,
                    familyArgs: {},
                });
            }),
        ];
        this.#currentGame = new ServerGame(this.namespace, ctorArgs);
        return undefined;
    }

    public get sockets(): Record<string, Group.Socket> {
        return this.namespace.sockets as Record<io.Socket["id"], Group.Socket>;
    }
}
export namespace Group {
    export type Socket      = __Group.Socket.ServerSide;
    export type Name        = __Group.Name;
    export type Passphrase  = __Group.Passphrase;
    export namespace Query {
        export type RequestCreate   = __Group.Exist.RequestCreate;
        export type NotifyStatus    = __Group.Exist.NotifyStatus;
    }
}
Object.freeze(Group);
Object.freeze(Group.prototype);
