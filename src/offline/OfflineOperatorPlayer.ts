import type { Coord, Tile } from "floor/Tile";
import type { Player } from "game/player/Player";
import { OperatorPlayer } from "game/player/OperatorPlayer";
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

}
