import { Coord } from "./Coord";
import { Tile } from "./Tile";
import { VisibleTile } from "./VisibleTile";

import { Euclid2 } from "./impl/Euclid2";
import { Beehive } from "./impl/Beehive";


/**
 * # 🗺 The Grid Class
 * 
 * A Collection of Tiles.
 */
export abstract class Grid<S extends Coord.System.GridCapable> {

    /**
     * _Does not call reset._
     * 
     * @param desc -
     */
    protected constructor(desc: Grid.CtorArgs<S>) {
        if (!desc.domGridHtmlIdHook) {
            desc.domGridHtmlIdHook = Grid.DEFAULT_HTML_ID_HOOK;
        }

        // Create and populate the HTML table element field:
        // (skip this step if my tiles are not displayed in a browser window)
        if (new desc.tileClass({ x: 0, y: 0, }) instanceof VisibleTile) {
            const domGrid = new HTMLTableElement();
            const tBody = domGrid.createTBody();
            for (const row of this.grid) {
                const rowElem  = tBody.insertRow();
                for (const tile of row) {
                    rowElem.appendChild((tile as VisibleTile<S>).tileCellElem);
                }
            }
            const carrier = document.getElementById(desc.domGridHtmlIdHook);
            if (!carrier) {
                throw new RangeError(`The ID \"${desc.domGridHtmlIdHook}\"`
                    + ` did not refer to an existing html element.`
                );
            }
            // remove all child elements and then 
            carrier.childNodes.forEach((node) => carrier.removeChild(node));
            carrier.appendChild(domGrid);
        }
    }

    /**
     * Calls {@link Tile#reset} for each {@link Tile} in this `Grid`.
     */
    public reset(): void {
        this.forEachTile((tile) => tile.reset());
    }

    /**
     * Performs simple checks that the grid is playable.
     * 
     * - Each tile in the grid has a non-self destination (coord#equals).
     * - (compute-heavyish): Each tile follows Impl.getAmbiguityThreshold
     */
    protected check(): void {
        // Check that 
    }



    /**
     * @returns
     * The {@link Tile} at the position in this `Grid` specified by
     * `coord`. This cannot be used for player bench tiles (which
     * already have the public access modifier via the player object).
     * 
     * @param coord - Must be within the bounds of this `Grid`.
     * @param radius - Defaults to `1`.
     * @throws `RangeError` if `coord` is not in the bounds of this `Grid`.
     */
    public abstract getTileAt(coord: Coord.Bare<S>): Tile<S>;

    /**
     * @returns
     * All tiles that can be moved to from `coord` using no more than
     * `radius` discrete movement actions. If the coordinate is for a
     * bench tile, then an empty array is returned.
     * 
     * @param coord -
     * @param radius -
     */
    public getTileDestsFrom(coord: Coord.Bare<S | Coord.System.__BENCH>, radius: number = 1): Array<Tile<S>> {
        if ((coord as Coord.Bare<Coord.System.__BENCH>).playerId !== undefined) {
            // TODO / NOTE: pretty much doing this because I don't want to
            //  bother with figuring out a way to get access to the player's
            //  bench tile in this scope. If we find a need for that, then change this.
            return [];
        } else {
            return this.abstractGetTileDestsFrom(coord as Coord.Bare<S>, radius);
        }
    }

    // TODO: add corresponding methods for "SourcesTo"

    protected abstract abstractGetTileDestsFrom(coord: Coord.Bare<S>, radius: number): Array<Tile<S>>;

    /**
     * @returns
     * A collection of all "Unoccupied Neighbouring Tiles" within
     * `radius` of `coord` according to {@link Pos#infNorm}. Tiles
     * for which {@link Tile#isOccupied} is `true` are filtered out
     * of the returned collection. The Tile at `coord` is included
     * if it is unoccupied at the time of the function call.
     * 
     * @param coord - The center / origin position-locator to search around.
     * @param radius - An inclusive bound on the {@link Pos#infNorm} filter.
     *      Defaults to `1`.
     */
    public getUNT(coord: Coord.Bare<S>, radius: number = 1): Array<Tile<S>> {
        return this.getTileDestsFrom(coord, radius).filter((tile) => !tile.isOccupied);
    }

    public abstract forEachTile(consumer: (tile: Tile<S>) => void, thisArg?: object): void;

    /**
     * @returns
     * One of the closest unoccupied neighbouring tiles toward the
     * direction of `intendedDest`. When possible, ties are encouraged
     * to be broken in such a way that imitates movement in a straight
     * path (visually speaking).
     * 
     * **Important:** The caller must first break the upward occupancy
     * link by calling `this.hostTile.evictOccupant();` This is so that
     * the current position of this `ArtificialPlayer` will always be
     * an option when everything adjacent to it is occupied.
     * 
     * @param sourceCoord
     * The coordinate from which to find the next hop.
     * 
     * @param intendedDest
     * Does not need to be within the boundaries of the {@link Game}'s
     * grid, or have integer-valued coordinate values.
     */
   public abstract getUntToward(sourceCoord: Coord<S>, intendedDest: Coord<S>): Tile<S>;

}



/**
 * 
 */
export namespace Grid {

    /**
     * Should only have one child: the main game grid's display.
     */
    export const DEFAULT_HTML_ID_HOOK = "game-grid-host";

    // ==============================================================

    /**
     * Values do not _need_ to be in range or integers.
     */
    export type Dimensions<S extends Coord.System.GridCapable>
        = S extends Coord.System.EUCLID2 ? Euclid2.Grid.Dimensions
        : S extends Coord.System.BEEHIVE ? Beehive.Grid.Dimensions
        : never;

    const Constructors = Object.freeze({
        [ Coord.System.EUCLID2 ]: Euclid2.Grid,
        [ Coord.System.BEEHIVE ]: Beehive.Grid,
    }) as Readonly<{
        [S in Coord.System.GridCapable]: ConstructorType<S>;
    }>;

    // ==============================================================
    // Note: The below exports do not require any modifications with
    // the additions of new coordinate systems.
    // ==============================================================

    export type CtorArgs<S extends Coord.System.GridCapable> = {
        dimensions: Dimensions<S>;
        tileClass: Tile.ConstructorType<S>;
        domGridHtmlIdHook?: string;
    };

    interface ConstructorType<S extends Coord.System.GridCapable> {

        /**
         * Constructor
         */
        new(desc: CtorArgs<S>): Grid<S> & Required<Grid.Dimensions<S>>;

        /**
         * @returns
         * From the caller's point of view, the ambiguity floor is
         * the minimum (inclusive) number of leaf nodes a language
         * must have to be playable with this coordinate system's grid.
         * From the specification's point of view, it is the promised
         * maximum size of a set `U` for any tile `t` in the grid
         * where `U` contains all tiles that a player could directly
         * move to from any tiles `in the set U'`, where `U'` contains
         * all tiles `t'` from which a player could move directly to
         * `t`, with the exception that `U` excludes `t`.
         */
        // TODO: write a test that checks that this holds for each implementation
        getAmbiguityThreshold(): number;

        /**
         * @see Grid.DimensionBounds
         */
        getSizeLimits(): Grid.DimensionBounds<S>;

        /**
         * @returns
         * A coordinate with random, integer-valued fields within the
         * specified upper limits
         * 
         * @param boundX An exclusive bound on x-coordinate.
         * @param boundY An exclusive bound on y-coordinate. Optional. Defaults to `boundX`.
         */
        random(bounds: DimensionBounds<S>): Coord<S>;
    };

    /**
     * @returns
     * A Grid of the specified system according to the given arguments.
     * 
     * @param coordSys -
     * @param ctorArgs -
     */
    export const of = <S extends Coord.System.GridCapable>(coordSys: S, ctorArgs: CtorArgs<S>): Grid<S> => {
        // Note: For some reason TypeScript can't figure out the type here.
        return new (Constructors[coordSys] as unknown as ConstructorType<S>)(ctorArgs);
    };

    /**
     * Bounds are inclusive. Ie. the specified values are _just_ allowed.
     * 
     * Upper and lower bounds must be strictly positive integer values.
     */
    export type DimensionBounds<S extends Coord.System.GridCapable> = Readonly<{
        [ P in keyof Dimensions<S> ]: Readonly<{
            min: number;
            max: number;
        }>;
    }>;

}