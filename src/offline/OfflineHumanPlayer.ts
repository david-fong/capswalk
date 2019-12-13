import { Tile } from "src/base/Tile";
import { OfflineGame } from "src/offline/OfflineGame";
import { HumanPlayer } from "src/base/player/HumanPlayer";
import { Player } from "src/base/player/Player";
import { PlayerMovementEvent } from "src/events/PlayerMovementEvent";

/**
 * 
 * 
 * @extends HumanPlayer
 */
export class OfflineHumanPlayer extends HumanPlayer {

    /**
     * @override
     */
    public readonly beNiceTo: Player["beNiceTo"];

    public constructor(game: OfflineGame, desc: Player.CtorArgs) {
        super(game, desc);
        this.beNiceTo = [];
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
