import type { Coord } from "floor/Tile";
import type { ClientGame } from "./ClientGame";
import type { Player } from "game/player/Player";
import { OperatorPlayer } from "game/player/OperatorPlayer";
import { PlayerMovementEvent } from "game/events/PlayerMovementEvent";


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
