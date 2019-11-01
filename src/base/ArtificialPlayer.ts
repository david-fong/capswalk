
/**
 * 
 */
abstract class ArtificialPlayer extends Player {

    public abstract computeDesiredDestination(): Tile;

    public abstract computeNextMovementTimer(): number;

}
