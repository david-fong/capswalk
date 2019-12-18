import { Tile } from "game/floor/Tile";
import { ClientGame } from "./ClientGame";
import { Player } from "game/player/Player";
import { HumanPlayer } from "game/player/HumanPlayer";
import { PlayerMovementEvent } from "game/events/PlayerMovementEvent";


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
        desc: Player.CtorArgs,
    ) {
        super(game, desc);
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
