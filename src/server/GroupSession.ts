import * as io from "socket.io";

import { Events } from "src/Events";
import { GameStateDump } from "src/base/Game";
import { ServerGame } from "src/server/ServerGame";
export { ServerGame } from "src/server/ServerGame";


/**
 * 
 */
namespace RoomNames {
    export const MAIN = "main";
}


/**
 * Manages communication between the server, and clients who play in
 * the same game together.
 * 
 * There is no explicit linking back to the {@link Server}. The only
 * such linkage is from our {@link GroupSession#namespace} to its
 * `io.Server`.
 */
export class GroupSession {

    // TODO: do we need to make this accessible outside?
    //public static readonly ROOM_NAMES: object = RoomNames;

    public readonly namespace: io.Namespace;
    protected currentGame: ServerGame | null;
    protected sessionHost: io.Socket;

    private readonly initialTtlTimeout: NodeJS.Timeout;
    private readonly deleteExternalRefs: VoidFunction;



    /**
     * 
     * @param namespace - 
     * @param initialTtl - If no sockets connect to this `GameSession`
     *      in this many seconds, it will close and clean itself up.
     * @param deleteExternalRefs - A function that- when called- deletes
     *      all external references to this newly constructed object
     *      such that it can be garbage collected.
     */
    public constructor(
        namespace: io.Namespace,
        initialTtl: number,
        deleteExternalRefs: VoidFunction,
    ) {
        this.namespace   = namespace;
        this.currentGame = null;
        this.sessionHost = undefined;

        this.initialTtlTimeout = setTimeout(
            () => {
                if (Object.entries(this.namespace.connected).length === 0) {
                    // If nobody connects to this session in the specified
                    // ammount of time, then close the session.
                    this.terminate();
                }
            },
            (initialTtl * 1000),
        ).unref();
        this.deleteExternalRefs = deleteExternalRefs;

        // Call the connection-event handler:
        this.namespace.on("connection", this.onConnection);
    }

    /**
     * 
     * @param socket - 
     */
    protected onConnection(socket: io.Socket): void {
        console.log("A user has connected.");
        socket.join(RoomNames.MAIN);

        if (Object.entries(this.namespace.connected).length === 0) {
            // Nobody has connected yet.
            // The first socket becomes the session host.
            clearTimeout(this.initialTtlTimeout);
            this.sessionHost = socket;
        }

        socket.on("disconnect", (...args: any[]): void => {
            if (socket === this.sessionHost) {
                // If the host disconnects, end the session.
                // TODO: this seems like a bad decision. What about just broadcasting
                // that the host player has died, and choose another player to become
                // the host?
                this.terminate();
                this.sessionHost = null; // TODO: change this. host should never be null.
            }
        });

        socket.on(
            Events.PlayerMovement.name,
            this.currentGame.processMoveRequest,
        );
    }

    /**
     * 
     */
    protected terminate(): void {
        // TODO: destroy the game?
        const namespace: io.Namespace = this.namespace;
        Object.values(namespace.connected).forEach(socket => {
            socket.disconnect();
        });
        namespace.removeAllListeners();
        delete namespace.server.nsps[namespace.name];
        (this.deleteExternalRefs)();
    }



    /**
     * @param dimensions - 
     */
    private createGameInstance(dimensions: { height: number, width?: number, }): void {
        const newGame: ServerGame = new ServerGame(this, dimensions);

        this.currentGame = newGame;
        this.namespace.emit(
            Events.DumpGameState.name,
            new GameStateDump(this.currentGame)
        );
    }



    /**
     * {@link Events}
     */
    private verifyCallbackFuncSignatures(): never {
        throw new Error("We don't do that here.");
    }



    protected allocatePlayerId(): number {
        return -1; // TODO
    }

}
