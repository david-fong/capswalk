import { Tile } from "src/base/Tile";
import { OfflineGame } from "src/offline/OfflineGame";
import { HumanPlayer } from "src/base/player/HumanPlayer";
import { PlayerId } from "src/base/player/Player";
import { PlayerMovementEvent } from "src/events/PlayerMovementEvent";

/**
 * 
 * 
 * @extends HumanPlayer
 */
export class OfflineHumanPlayer extends HumanPlayer {

    public constructor(game: OfflineGame, idNumber: PlayerId, username: string) {
        super(game, idNumber, username);
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
