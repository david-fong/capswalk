import * as io from "socket.io";

import { Events } from "src/Events";
import { Pos, Tile } from "src/base/Tile";
import { ClientGame } from "src/client/ClientGame";
import { HumanPlayer } from "src/base/HumanPlayer";
import { PlayerMovementEvent } from "src/base/Player";

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
    public makeMovementRequest(dest: Tile): void {
        // ServerGame handles with processMoveRequest.
        // Arguments must follow that function signature.
        this.game.socket.emit(
            Events.PlayerMovement.name,
            new PlayerMovementEvent(this.idNumber, dest),
        );
    }

    /**
     * {@link Events}
     */
    private verifyCallbackFuncSignatures(): never {
        throw new Error("We don't do that here.");
    }

}
