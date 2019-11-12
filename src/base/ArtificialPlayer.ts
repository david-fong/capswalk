import { Pos, Tile } from "src/base/Tile";
import { Player } from "src/base/Player";

/**
 * 
 * 
 * @extends Player
 */
export abstract class ArtificialPlayer extends Player {

    protected scheduledMovementCallbackId: number;

    /**
     * Returns a {@link Pos} representing an absolute coordinate (ie.
     * one that is relative to the {@link Game}'s origin position')
     * that this `ArtificialPlayer` intends to move toward in its next
     * movement request. Pos may contain non-integer coordinate values,
     * and it does not have to be inside the bounds of the {@link Grid}.
     */
    public abstract computeDesiredDestination(): Pos;

    public abstract computeNextMovementTimer(): number;

    /**
     * @returns A TODO
     * Note that the current position of this `ArtificialPlayer` is
     * always an option when everything adjacent to it is occupied.
     * 
     * @param intendedDest - 
     */
    protected getUntToward(intendedDest: Pos): Tile {
        const unfavorableness: Function = (tile: Tile): number => {
            return intendedDest.sub(tile.pos).twoNorm;
        };
        const options: ReadonlyArray<Tile> = this.getUNT()
            .sort((tileA, TileB) => {
                return unfavorableness(tileA.pos)
                     - unfavorableness(TileB.pos);
            });
        // choose one of the two most favorable using some randomness
        // weighted to make the long term path of movement to follow
        // a non-45-degree-angled line toward `intendedDest`.
        // TODO
        return undefined;
    }

}
