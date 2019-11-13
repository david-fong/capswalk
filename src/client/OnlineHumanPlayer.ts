import * as io from "socket.io";

import { Events } from "src/Events";
import { Pos } from "src/base/Tile";
import { ClientGame } from "src/client/ClientGame";
import { HumanPlayer } from "src/base/HumanPlayer";

/**
 * 
 * 
 * @extends HumanPlayer
 */
export class OnlineHumanPlayer extends HumanPlayer {

    /**
     * @override {@link Player#game}
     */
    public readonly game: ClientGame;



    public constructor(game: ClientGame, idNumber: number) {
        super(game, idNumber);
    }



    /**
     * @override {@link Player#makeMovementRequest}
     */
    public makeMovementRequest(dest: Pos): void {
        this.game.socket.emit(Events.PlayerMovement.name, this.idNumber, dest.asBarePos());
    }

}
