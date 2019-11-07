import { Player } from "base/Player";
import { Tile } from "base/Tile";

/**
 * 
 * 
 * @extends Player
 */
export abstract class ArtificialPlayer extends Player {

    protected scheduledMovementCallbackId: number;

    public abstract computeDesiredDestination(): Tile;

    public abstract computeNextMovementTimer(): number;

}
