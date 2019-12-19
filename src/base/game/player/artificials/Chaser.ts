import { Pos } from "floor/Pos";
import { Game } from "game/Game";
import { Player } from "game/player/Player";
import { ArtificialPlayer } from "../ArtificialPlayer";


/**
 * 
 * @extends ArtificialPlayer
 */
export class Chaser extends ArtificialPlayer {

    protected constructor(game: Game, desc: Player.CtorArgs) {
        super(game, desc);
    }

    /**
     * @override
     */
    protected computeDesiredDestination(): Pos {
        return undefined!; // this.game.allHumanPlayers; // TODO
    }

    /**
     * @override
     */
    protected computeNextMovementTimer(): number {
        return undefined!; // TODO
    }

}
