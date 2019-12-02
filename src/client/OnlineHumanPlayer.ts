import { Tile } from "src/base/Tile";
import { ClientGame } from "src/client/ClientGame";
import { HumanPlayer } from "src/base/player/HumanPlayer";
import { PlayerId } from "src/base/player/Player";
import { PlayerMovementEvent } from "src/events/PlayerMovementEvent";


/**
 * 
 * @extends HumanPlayer
 */
export class OnlineHumanPlayer extends HumanPlayer {

    /**
     * @override
     */
    public readonly game: ClientGame;



    public constructor(
        game: ClientGame,
        idNumber: PlayerId,
        username: string,
    ) {
        super(game, idNumber, username);
    }



    /**
     * @override
     */
    public abstractMakeMovementRequest(dest: Tile): void {
        // ServerGame handles with processMoveRequest.
        // Arguments must follow that function signature.
        this.game.socket.emit(
            PlayerMovementEvent.EVENT_NAME,
            new PlayerMovementEvent(
                this.idNumber,
                this.lastAcceptedRequestId,
                dest,
            ),
        );
    }

}
