import { Tile } from "src/base/Tile";
import { OfflineGame } from "src/offline/OfflineGame";
import { HumanPlayer } from "src/base/HumanPlayer";
import { PlayerId } from "src/base/Player";
import { PlayerMovementEvent } from "src/base/PlayerMovementEvent";

/**
 * 
 * 
 * @extends HumanPlayer
 */
export class OfflineHumanPlayer extends HumanPlayer {

    public constructor(game: OfflineGame, idNumber: PlayerId) {
        super(game, idNumber);
    }



    /**
     * Unlike the online situation, the Game Manager is run in the same
     * JavaScript engine as the Operator's player. We can make a direct
     * request to the Game Manager to process the movement request.
     * 
     * @override {@link Player#makeMovementRequest}
     */
    public makeMovementRequest(dest: Tile): void {
        this.game.processMoveRequest(new PlayerMovementEvent(this.idNumber, dest));
    }

}
