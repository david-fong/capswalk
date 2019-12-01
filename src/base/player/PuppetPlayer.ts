import { Tile } from "src/base/Tile";
import { Game } from "src/base/Game";
import { Player, PlayerId } from "src/base/player/Player";


/**
 * The substitute implementation when the enclosing Game-type class
 * does not need to manage the internals of a certain player.
 * 
 * Specifically,
 * - Offline games never use this.
 * - Server  games use this for the operator, which doesn't exist, and in place of human players.
 * - Client  games use this in place of artificial players and human players.
 */
class PuppetPlayer extends Player {

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
