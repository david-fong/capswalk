import type { Coord, Tile } from "floor/Tile";
import type { Player } from "game/player/Player";
import { OperatorPlayer } from "game/player/OperatorPlayer";
import { PlayerActionEvent } from "game/events/PlayerActionEvent";
import type { OfflineGame } from "../offline/OfflineGame";

/**
 *
 *
 * @extends OperatorPlayer
 */
export class OfflineOperatorPlayer<S extends Coord.System> extends OperatorPlayer<S> {

    /**
     * @override
     */
    declare public readonly game: OfflineGame<S>;

    public constructor(game: OfflineGame<S>, desc: Player.CtorArgs) {
        super(game, desc);
    }


    /**
     * Unlike the online situation, the Game Manager is run in the same
     * JavaScript engine as the Operator's player. We can make a direct
     * request to the Game Manager to process the movement request.
     *
     * @override {@link Player#makeMovementRequest}
     */
    protected __abstractMakeMovementRequest(dest: Tile<S>): void {
        this.game.processMoveRequest(
            new PlayerActionEvent.Movement(
                this.playerId,
                this.lastAcceptedRequestId,
                dest
            ),
        );
    }

}
