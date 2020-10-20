import { JsUtils } from "defs/JsUtils";
import { Coord, Tile } from "./Tile";
import { TileGetter } from "./TileGetter";

import type { Euclid2 } from "./impl/Euclid2";
import type { Beehive } from "./impl/Beehive";


/**
 * # 🗺 The Grid Class
 *
 * A Collection of Tiles.
 */
export abstract class Grid<S extends Coord.System> implements TileGetter.Source<S> {

    // A type-annotated alias to this.constructor.
    public readonly static: Grid.ClassIf<S>;

    public readonly dimensions: Grid.Dimensions<S>;

    public get area(): number {
        return this.static.getArea(this.dimensions);
    }

    public readonly tile: TileGetter<S,[Coord.Bare[S]]>;


    /**
     * Protected. See `Grid.getImplementation` for how to access class
     * literals for construction.
     *
     * @param desc -
     */
    protected constructor(desc: Grid.CtorArgs<S>) {
        this.static = desc.gridClass;
        this.dimensions = desc.dimensions;
        this.tile = new TileGetter(this);
        JsUtils.propNoWrite(this as Grid<S>, ["static", "dimensions", "tile",]);
    }

    /**
     * Calls {@link Tile#reset} for each {@link Tile} in this `Grid`.
     */
    public reset(): void {
        this.forEachTile((tile) => tile.reset());
    }


    /**
     * For BaseGame's implementation of SER/DES to work, the traversal
     * order taken by an implementation of this method must depend
     * only on the dimensions of the instance. Ie. If two Grids (such
     * as those at the Client and Server when separated by a network)
     * were constructed with the same arguments for their dimensions,
     * then their Tiles should be traversed in the same order by this
     * function.
     *
     * @param consumer -
     */
    public abstract forEachTile(consumer: (tile: Tile<S>, index: number) => void): void;

    public abstract shuffledForEachTile(consumer: (tile: Tile<S>) => void): void;

    /**
     * @returns
     * One of the closest unoccupied neighbouring tiles toward the
     * direction of `intendedDest`. When possible, ties are encouraged
     * to be broken in such a way that imitates movement in a straight
     * path (visually speaking).
     *
     * **Important:** If All destinations from sourceCoord are occupied
     * (which includes `sourceCoord` itself), the implementation must
     * return `sourceCoord`.
     *
     * @param intendedDest
     * Does not need to be within the boundaries of the {@link Game}'s
     * grid, or have integer-valued coordinate values.
     *
     * @param sourceCoord
     * The coordinate from which to find the next hop.
     */
    public abstract getUntToward(intendedDest: Coord[S], sourceCoord: Coord[S]): Tile<S>;

    /**
     * The opposite of `getUntToward`.
     *
     * @param avoidCoord -
     * @param sourceCoord -
     */
    public abstract getUntAwayFrom(avoidCoord: Coord[S], sourceCoord: Coord[S]): Tile<S>;

    /**
     * This action is commonly performed by the GameManager when
     * shuffling in new CSP's to its grid. Grid implementations are
     * encouraged to override it if they have a more efficient way to
     * produce the same result.
     */
    public getDestsFromSourcesTo(originCoord: Coord[S]): Array<Tile<S>> {
        return Array.from(new Set(
            this.tile.sourcesTo(originCoord).get
                .flatMap((sourceToTarget) => this.tile.destsFrom(sourceToTarget.coord).get)
        ));
    }

    public getRandomCoord(): Coord[S] {
        return this.static.getRandomCoord(this.dimensions);
    }

    /**
     * A coord that is at most `radius` movements away from `origin`.
     * The returned value does not necessarily need to be within this
     * grid's dimensions as long as the returned coordinate can be
     * meaningfully truncated by `getUntToward` when passing `origin`
     * as the `sourceCoord` argument.
     *
     * The returned value should follow a uniform distribution.
     */
    public abstract getRandomCoordAround(origin: Coord.Bare[S], radius: number): Coord[S];


    /**
     * @override
     */
    public abstract _getTileAt(coord: Coord.Bare[S]): Tile<S>;

    /**
     * @override
     */
    public abstract _getTileDestsFrom(coord: Coord.Bare[S]): Array<Tile<S>>;

    /**
     * @override
     */
    public abstract _getTileSourcesTo(coord: Coord.Bare[S]): Array<Tile<S>>;

    /**
     * The returned value must be consistent with results from the
     * methods `_getTileDestsFrom` and `_getTileSourcesTo`.
     *
     * @param source -
     * @param dest -
     */
    public abstract minMovesFromTo(source: Coord.Bare[S], dest: Coord.Bare[S]): number;
}
export namespace Grid {

    /**
     * Values do not _need_ to be in range or integers.
     */
    export type Dimensions<S extends Coord.System>
        = S extends Coord.System.EUCLID2 ? Euclid2.Grid.Dimensions
        : S extends Coord.System.BEEHIVE ? Beehive.Grid.Dimensions
        : never;

    // ==============================================================
    // Note: The below exports do not require any modifications with
    // the additions of new coordinate systems.
    // ==============================================================

    export type CtorArgs<S extends Coord.System> = Readonly<{
        gridClass: Grid.ClassIf<S>;
        tileClass: Tile.ClassIf<S>;
        coordSys: S;
        dimensions: Dimensions<S>;
    }>;

    /**
     * Used to simulate abstract static methods.
     */
    export interface ClassIf<S extends Coord.System> {

        /**
         * Constructor
         */
        new(desc: CtorArgs<S>): Grid<S>;

        /**
         * @returns
         * From the caller's point of view, the ambiguity floor is the
         * minimum number of leaf nodes a language must have to be
         * playable with this coordinate system's grid.
         *
         * From the specification's point of view, it is the promised
         * maximum size- for any tile in the grid- of the set of all
         * destinations from sources to itself, excluding itself.
         */
        // TODO.test write a test that checks that this holds for each implementation?
        getAmbiguityThreshold(): number;

        /**
         * @see Grid.DimensionBounds
         */
        getSizeLimits(): Grid.DimensionBounds<S>;

        /**
         * @returns
         * The number of Tiles that could fit in a Grid of such bounds.
         *
         * @param bounds -
         */
        getArea(bounds: Dimensions<S>): number;

        /**
         * \*Assuming the grid is lattice-like and is partitioned into
         * highly similar patches where each patch has a center, and
         * all tiles in the patch are closer to that center tile than
         * to any other patch's center tile. Returns the minimum number
         * of tiles that must be visited to get from the center of one
         * patch to any neighbouring patch.
         */
        getDiameterOfLatticePatchHavingArea(area: number): number;

        /**
         * @returns
         * A coordinate with random, integer-valued fields within the
         * specified upper limits
         *
         * @param boundX An exclusive bound on x-coordinate.
         * @param boundY An exclusive bound on y-coordinate. Optional. Defaults to `boundX`.
         */
        getRandomCoord(bounds: Dimensions<S>): Coord[S];

        /**
         * Return values do not need to be the same for repeated calls
         * with identical arguments. None of the returned coordinates
         * should be the same.
         *
         * @param playerCounts -
         */
        getSpawnCoords(
            playerCounts: TU.RoArr<number>,
            dimensions: Dimensions<S>,
        ): TU.RoArr<TU.RoArr<Coord.Bare[S]>>;

    };

    // Each implementation must register itself into this dictionary.
    export declare const _Constructors: {
        readonly [ S in Coord.System ]: Grid.ClassIf<S>
    };

    /**
     * @returns
     * A Grid class for the specified coordinate system.
     *
     * @param coordSys -
     */
    export const getImplementation = <S extends Coord.System>(coordSys: S): ClassIf<S> => {
        // Note: At the time of writing this, separating this into
        // two lines is necessary (otherwise Typescript will feel
        // overwhelmed)
        const ctor = _Constructors[coordSys];
        return ctor as unknown as ClassIf<S>;
    };

    /**
     * Bounds are inclusive. Ie. the specified values are _just_ allowed.
     *
     * Upper and lower bounds must be strictly positive integer values.
     */
    export type DimensionBounds<S extends Coord.System> = Readonly<{
        [ P in keyof Dimensions<S> ]: Readonly<{
            min: number;
            max: number;
        }>;
    }>;

}
// Grid gets frozen in PostInit after _Constructors get initialized.