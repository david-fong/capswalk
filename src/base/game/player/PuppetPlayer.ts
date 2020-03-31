import type { Coord } from "floor/Tile";
import type { Game } from "game/Game";
import { Player} from "./Player";


/**
 * The substitute implementation when the enclosing Game-type class
 * does not need to manage the internals of a certain player.
 *
 * Specifically,
 * - All game implementations use this for non-operator human players.
 * - Client games use this in place of artificial players.
 */
export class PuppetPlayer<S extends Coord.System> extends Player<S> {

    public constructor(game: Game<any,S>, desc: Player.CtorArgs) {
        super(game, desc);
    }

    /**
     * @override
     */
    protected __abstractMakeMovementRequest(dest: Player<S>["hostTile"]): never {
        throw new TypeError("This operation is unsupported for this implementation.");
    }

}
