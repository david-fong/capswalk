import type { Coord } from "floor/Coord";
import type { GameManager } from "game/__gameparts/Manager";

import { Player } from "game/player/Player";
import { ArtificialPlayer } from "../ArtificialPlayer";


/**
 *
 * @extends ArtificialPlayer
 */
// TODO.impl
export class Chaser<S extends Coord.System> extends ArtificialPlayer<S> {

    protected constructor(game: GameManager<any,S>, desc: Player.CtorArgs) {
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
