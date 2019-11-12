import * as io from "socket.io";

import { EventNames } from "src/EventNames";
import { Pos } from "src/Pos";
import { ServerGame } from "src/server/ServerGame";
export { ServerGame } from "src/server/ServerGame";



/**
 * 
 */
export enum RoomNames {
    MAIN,
}

/**
 * Manages communication between the server, and clients who play in
 * the same game together.
 */
export class GroupSession {

    protected namespace: io.Namespace;
    protected currentGameInstance: ServerGame | null;

    public constructor() {
        ;
        this.namespace.emit(EventNames.DUMP_GAME_STATE, new GameStateDump());
    }

    /**
     * 
     * @param socket - 
     */
    protected onConnection(socket: io.Socket): void {
        console.log("A user has connected.");
        socket.emit(EventNames.ASSIGN_PLAYER_ID, this.allocatePlayerId());

        socket.on("disconnect", (...args: any[]): void => {
            ;
        });

        socket.on(
                EventNames.PLAYER_MOVEMENT,
                (playerId: number, destPos: Pos): void => {
            // TODO: make socket have playerId field?
            this.currentGameInstance.processMoveRequest(playerId, destPos);
        });
    }

    /**
     * 
     * @param socket - 
     */
    protected onGameHostConnection(socket: io.Socket): void {
        // TODO: host is responsible for special power-actions like
        // restarting a game, and choosing new settings like language.

        this.onConnection(socket);
    }

    /**
     * 
     * @param height -  Vertical dimension of the grid to create.
     * @param width - Horizontal dimension of the grid to create. Defaults to `height`.
     */
    private createGameInstance(height: number, width: number = height): void {
        const newGame: ServerGame = new ServerGame(height, width);

        this.currentGameInstance = newGame;
    }

}
