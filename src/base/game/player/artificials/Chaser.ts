import { Coord } from "floor/Coord";
import { Game } from "game/Game";
import { Player } from "game/player/Player";
import { ArtificialPlayer } from "../ArtificialPlayer";


/**
 * 
 * @extends ArtificialPlayer
 */
export class Chaser<S extends Coord.System.GridCapable> extends ArtificialPlayer<S> {

    protected constructor(game: Game<any,S>, desc: Player.CtorArgs) {
        super(game, desc);
    }

    /**
     * @override
     */
    protected computeDesiredDestination(): Coord<S> {
        return undefined!; // this.game.allHumanPlayers; // TODO
    }

    /**
     * @override
     */
    protected computeNextMovementTimer(): number {
        return undefined!; // TODO
    }

}
