import { Tile } from "floor/Tile";
import { OfflineGame } from "./OfflineGame";
import { HumanPlayer } from "game/player/HumanPlayer";
import { Player } from "game/player/Player";
import { PlayerMovementEvent } from "game/events/PlayerMovementEvent";

/**
 * 
 * 
 * @extends HumanPlayer
 */
export class OfflineHumanPlayer extends HumanPlayer {

    public constructor(game: OfflineGame, desc: Player.CtorArgs) {
        super(game, desc);
    }



    /**
     * Unlike the online situation, the Game Manager is run in the same
     * JavaScript engine as the Operator's player. We can make a direct
     * request to the Game Manager to process the movement request.
     * 
     * @override {@link Player#makeMovementRequest}
     */
    public abstractMakeMovementRequest(dest: Tile): void {
        this.game.processMoveRequest(
            new PlayerMovementEvent(
                this.idNumber,
                this.lastAcceptedRequestId,
                dest
            ),
        );
    }

}
