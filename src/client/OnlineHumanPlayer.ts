import { Tile, Coord } from "floor/Tile";
import { ClientGame } from "./ClientGame";
import { Player } from "game/player/Player";
import { HumanPlayer } from "game/player/HumanPlayer";
import { PlayerMovementEvent } from "game/events/PlayerMovementEvent";


/**
 * 
 * @extends HumanPlayer
 */
export class OnlineHumanPlayer<S extends Coord.System.GridCapable> extends HumanPlayer<S> {

    /**
     * @override
     */
    public declare readonly game: ClientGame<S>;



    public constructor(
        game: ClientGame<S>,
        desc: Player.CtorArgs,
    ) {
        super(game, desc);
    }



    /**
     * @override
     */
    public abstractMakeMovementRequest(dest: Player<S>["hostTile"]): void {
        // ServerGame handles with processMoveRequest.
        // Arguments must follow that function signature.
        this.game.socket.emit(
            PlayerMovementEvent.EVENT_NAME,
            new PlayerMovementEvent(
                this.playerId,
                this.lastAcceptedRequestId,
                dest,
            ),
        );
    }

}
