import type { Coord, Tile } from "floor/Tile";
import type { Player } from "game/player/Player";
import { OperatorPlayer } from "game/player/OperatorPlayer";
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

}
