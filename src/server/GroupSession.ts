import * as io from "socket.io";

import type { Coord } from "floor/Tile";
import type { Grid } from "floor/Grid";
import type { Game } from "game/Game";
import { ServerGame } from "./ServerGame";
import { Player, Team } from "game/player/Player";

export { ServerGame } from "./ServerGame";


/**
 * Manages communication between the server, and clients who play in
 * the same game together.
 *
 * There is no explicit linking back to the {@link Server}. The only
 * such linkage is from our {@link GroupSession#namespace} to its
 * `io.Server`.
 */
export class GroupSession {

    public readonly namespace: io.Namespace;
    protected currentGame?: ServerGame<any>;
    protected sessionHost: io.Socket;

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
    public constructor(
        namespace: io.Namespace,
        deleteExternalRefs: VoidFunction,
        initialTtl: number,
    ) {
        this.namespace   = namespace;
        this.currentGame = undefined;

        this.initialTtlTimeout = setTimeout(() => {
            if (Object.keys(this.namespace.connected).length === 0) {
                // If nobody connects to this session in the specified
                // ammount of time, then close the session.
                this.terminate();
            }
        }, (initialTtl * 1000)).unref();
        this.deleteExternalRefs = deleteExternalRefs;

        // Call the connection-event handler:
        this.namespace.on("connection", this.onConnection);
    }

    /**
     *
     * @param socket -
     */
    protected onConnection(socket: GroupSession.Socket): void {
        console.log("A user has connected.");
        socket.join(GroupSession.RoomNames.MAIN);
        socket.teamId = undefined;
        socket.updateId = 0;

        if (Object.keys(this.namespace.connected).length === 0) {
            // Nobody has connected yet.
            // The first socket becomes the session host.
            clearTimeout(this.initialTtlTimeout);
            this.sessionHost = socket;
            // TODO.impl set socket.isPrivileged
        }

        socket.on("disconnect", (...args: any[]): void => {
            if (socket === this.sessionHost) {
                // If the host disconnects, end the session.
                // TODO.impl this seems like a bad decision. What about just broadcasting
                // that the host player has died, and choose another player to become
                // the host?
                this.terminate();
            }
        });
    }

    /**
     * - Deletes its own reference to its game (if it exists).
     * - Disconnects each client.
     * - Removes all listeners from this namespace.
     * - Deletes the enclosed Socket.IO namespace from the Server.
     * - Deletes the only external reference so this can be garbage collected.
     */
    protected terminate(): void {
        // TODO.impl notify clients?
        delete this.currentGame;
        const nsps: io.Namespace = this.namespace;
        nsps.removeAllListeners("connect");
        nsps.removeAllListeners("connection");
        Object.values(nsps.connected).forEach((socket) => {
            socket.disconnect();
        });
        nsps.removeAllListeners();
        delete nsps.server.nsps[nsps.name];
        (this.deleteExternalRefs)();
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
    private createGameInstance<S extends Coord.System>(
        coordSys: S,
        gridDimensions: Grid.Dimensions<S>,
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
        // TODO.impl Everything with current placeholder of `undefined!`.
        this.currentGame = new ServerGame(this.namespace, {
            coordSys,
            gridDimensions,
            gridHtmlIdHook: undefined,
            averageFreeHealthPerTile: undefined!,
            languageName: undefined!,
            langBalancingScheme: undefined!,
            operatorIndex: undefined,
            playerDescs: {
                ...Object.values(this.sockets).map((socket) => {
                    return {
                        familyId: Player.Family.HUMAN,
                        teamId: socket.teamId!,
                        socketId: socket.id,
                        username: socket.username!, // checked above.
                        noCheckGameOver: false,
                    };
                }),
            },
        });
        return undefined;
    }

    public get sockets(): Record<string, GroupSession.Socket> {
        return this.namespace.sockets as Record<io.Socket["id"], GroupSession.Socket>;
    }

}


export namespace GroupSession {

    /**
     * An extension of {@link io.Socket}. It is very convenient to tack
     * these fields directly onto the socket objects.
     */
    export type Socket = io.Socket & {
        username?: Player.Username;
        teamId?: Team.Id; // These input values can be messy and non-continuous. They will be cleaned later.
        updateId: number; // initial value = 0
    };

    export type SessionName = string;
    export namespace SessionName {
        /**
         * @see Player.Username.REGEXP
         */
        export const REGEXP = /[a-zA-Z](?:[a-zA-Z0-9:-]+?){4,}/;
    }

    /**
     *
     */
    export const enum RoomNames {
        MAIN = "main",
    }


    /**
     *
     */
    export class CtorArgs {

        public static EVENT_NAME = "group-session-create";

        public static DEFAULT_INITIAL_TTL = 60;

        /**
         * The client should set this to a string to use as a group
         * name. They should try to satisfy {@link SessionName.REGEXP},
         * although that is not manditory.
         *
         * The Server should respond with this field set either to be
         * a Socket.IO namespace based off the client's request that
         * is open for connecting, or to the empty string to indicate
         * that the request was rejected.
         */
        public groupName: SessionName;

        /**
         * The Server should ignore any value set here by the client.
         *
         * The Server should respond to the client setting this value
         * to an approximate number of _seconds_ before the created
         * {@link GroupSession} will decide it was abandoned at birth
         * and get cleaned up (if nobody connects to it in that time).
         *
         * If the request was rejected, the client should ignore any
         * value set here by the Server.
         */
        public initialTtl: number;

        public constructor(
            groupName: SessionName,
            initialTtl: number = CtorArgs.DEFAULT_INITIAL_TTL
        ) {
            this.groupName = groupName;
            this.initialTtl = initialTtl;
        }
    };
}
Object.freeze(GroupSession);
Object.freeze(GroupSession.prototype);
