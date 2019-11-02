
/**
 * 
 * 
 * @extends Player
 */
abstract class ArtificialPlayer extends Player {

    protected scheduledMovementCallbackId: number;

    public abstract computeDesiredDestination(): Tile;

    public abstract computeNextMovementTimer(): number;

}
