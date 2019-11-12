import * as io from "socket.io";

import { EventNames } from "src/EventNames";
import { BarePos } from "src/Pos";
import { GameStateDump } from "src/base/Game";
import { ServerGame } from "src/server/ServerGame";
export { ServerGame } from "src/server/ServerGame";


/**
 * 
 */
class RoomNames {
    public static readonly MAIN: string = <const>"main";
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
    protected currentGameInstance: ServerGame | null;
    protected sessionHost: io.Socket; // TODO: "| null" ?



    public constructor(namespace: io.Namespace) {
        this.namespace = namespace;
        this.currentGameInstance = null;
        this.sessionHost = null;
    }

    /**
     * 
     * @param socket - 
     */
    protected onConnection(socket: io.Socket): void {
        console.log("A user has connected.");
        socket.join(RoomNames.MAIN);

        if (this.sessionHost === null) {
            this.sessionHost = socket;
        }

        socket.on("disconnect", (...args: any[]): void => {
            if (socket === this.sessionHost) {
                this.sessionHost = null;
            }
        });

        socket.on(
                EventNames.PLAYER_MOVEMENT,
                (playerId: number, destPos: BarePos): void => {
            // TODO: this makes is technically possible for a client to
            // send a request that tells me to move someone other than them.
            // If we want to be more picky, we should add checks for this.
            this.currentGameInstance.processMoveRequest(playerId, destPos);
        });
    }



    /**
     * 
     * @param height -  Vertical dimension of the grid to create.
     * @param width - Horizontal dimension of the grid to create. Defaults to `height`.
     */
    private createGameInstance(height: number, width: number = height): void {
        const newGame: ServerGame = new ServerGame(this, height, width);

        this.currentGameInstance = newGame;
        this.namespace.emit(EventNames.DUMP_GAME_STATE, new GameStateDump(this.currentGameInstance));
    }

}
