import type { Coord, Tile } from "floor/Tile";
import type { Player } from "game/player/Player";
import { OperatorPlayer } from "game/player/OperatorPlayer";
import { PlayerActionEvent } from "game/events/PlayerActionEvent";
import type { ClientGame } from "./ClientGame";


/**
 *
 * @extends OperatorPlayer
 */
export class OnlineOperatorPlayer<S extends Coord.System> extends OperatorPlayer<S> {

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
    protected __abstractMakeMovementRequest(dest: Tile<S>): void {
        // ServerGame handles with processMoveRequest.
        // Arguments must follow that function signature.
        this.game.socket.emit(
            PlayerActionEvent.EVENT_NAME.Movement,
            new PlayerActionEvent.Movement(
                this.playerId,
                this.lastAcceptedRequestId,
                dest,
            ),
        );
    }

}
