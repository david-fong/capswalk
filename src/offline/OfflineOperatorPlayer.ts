import { Coord } from "floor/Tile";
import { OperatorPlayer } from "game/player/OperatorPlayer";
import { Player } from "game/player/Player";
import { PlayerMovementEvent } from "game/events/PlayerMovementEvent";

/**
 * 
 * 
 * @extends OperatorPlayer
 */
export class OfflineOperatorPlayer<S extends Coord.System> extends OperatorPlayer<S> {

    // /**
    //  * @override
    //  */
    // declare public readonly game: OfflineGame<S>;
    //
    // public constructor(game: OfflineGame<S>, desc: Player.CtorArgs) {
    //     super(game, desc);
    // }


    /**
     * Unlike the online situation, the Game Manager is run in the same
     * JavaScript engine as the Operator's player. We can make a direct
     * request to the Game Manager to process the movement request.
     * 
     * @override {@link Player#makeMovementRequest}
     */
    public abstractMakeMovementRequest(dest: Player<S>["hostTile"]): void {
        this.game.processMoveRequest(
            new PlayerMovementEvent(
                this.playerId,
                this.lastAcceptedRequestId,
                dest
            ),
        );
    }

}
