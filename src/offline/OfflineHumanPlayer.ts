import { Pos } from "src/Pos";
import { OfflineGame } from "./OfflineGame";
import { HumanPlayer } from "src/base/HumanPlayer";

/**
 * 
 * 
 * @extends HumanPlayer
 */
export class OfflineHumanPlayer extends HumanPlayer {

    public constructor(game: OfflineGame, idNumber: number) {
        super(game, idNumber);
    }



    /**
     * Unlike the online situation, the Game Manager is run in the same
     * JavaScript engine as the Operator's player. We can make a direct
     * request to the Game Manager to process the movement request.
     * 
     * @implements `Player::makeMovementRequest`
     */
    public makeMovementRequest(dest: Pos): void {
        this.game.processMoveRequest(this.idNumber, dest);
    }

}
