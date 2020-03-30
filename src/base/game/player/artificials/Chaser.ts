import type { Coord } from "floor/Coord";
import type { Game } from "game/Game";
import type { Player } from "game/player/Player";
import { ArtificialPlayer } from "../ArtificialPlayer";


/**
 *
 * @extends ArtificialPlayer
 */
// TODO
export class Chaser<S extends Coord.System> extends ArtificialPlayer<S> {

    protected constructor(game: Game<any,S>, desc: Player.CtorArgs) {
        super(game, desc);
    }

    /**
     * @override
     */
    protected computeDesiredDestination(): Coord<S> {
        //const humans = this.game.__players.HUMAN;
        return undefined!;
    }

    /**
     * @override
     */
    protected computeNextMovementTimer(): number {
        return undefined!;
    }

}
