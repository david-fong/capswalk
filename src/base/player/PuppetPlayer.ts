import { Tile } from "src/base/Tile";
import { Game } from "src/base/Game";
import { Player, PlayerId } from "src/base/player/Player";


/**
 * The substitute implementation when the enclosing Game-type class
 * does not need to manage the internals of a certain player.
 * 
 * Specifically,
 * - All game implementations use this for non-operator human players.
 * - Client games use this in place of artificial players.
 */
export class PuppetPlayer extends Player {

    public constructor(game: Game, idNumber: PlayerId) {
        super(game, idNumber);
    }

    /**
     * @override
     */
    protected abstractMakeMovementRequest(dest: Tile): never {
        throw new TypeError("This operation is unsupported for this implementation.");
    }

}
