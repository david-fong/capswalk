import { Player } from "utils/TypeDefs";

import { Coord } from "./Coord";
import { Tile } from "./Tile";
import { VisibleTile } from "./VisibleTile";

import { Euclid2 } from "./impl/Euclid2";
import { Beehive } from "./impl/Beehive";


type NullPid = typeof Player.Id.NULL;

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

    public abstract getNeighbouringTiles(coord: Coord.Bare<S>, radius?: number): Array<Tile<S>>;

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
        return this.getNeighbouringTiles(coord, radius).filter((tile) => !tile.isOccupied);
    }

    public abstract forEachTile(consumer: (tile: Tile<S>) => void, thisArg?: object): void;

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

    const Constructors = Object.freeze(<const>{
        [ Coord.System.EUCLID2 ]: Euclid2.Grid,
        [ Coord.System.BEEHIVE ]: Beehive.Grid,
    });
    /**
     * Will err if:
     * - the coordinate systems between mappings don't match.
     * - the extension's constructor signature is not compatible
     *   with that of the generic abstract base class.
     */
    const __ctorMapTypeAssertion__ = (): void => {
        Constructors as Readonly<{
            [S in Coord.System.GridCapable]: ConstructorType<S>;
        }>;
    };

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
        new(desc: CtorArgs<S>): Grid<S>;

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
    };

    /**
     * @returns
     * A Grid of the specified system according to the given arguments.
     * 
     * @param coordSys -
     * @param ctorArgs -
     */
    export const of = <S extends Coord.System.GridCapable>(coordSys: S, ctorArgs: CtorArgs<S>): Grid<S> => {
        // Note: For some reason TypeScript is unhappy here about the
        // `GET_SIZE_LIMITS` method so we have to cast to unknown first. :/
        const ctor = Constructors[coordSys] as unknown as ConstructorType<S>;
        return new (ctor)(ctorArgs);
    };

    /**
     * Bounds are inclusive. Ie. the specified values are _just_ allowed.
     * 
     * Bounds must be strictly positive.
     */
    export type DimensionBounds<S extends Coord.System.GridCapable> = Readonly<{
        [ P in keyof Dimensions<S> ]: Readonly<{
            min: number;
            max: number;
        }>;
    }>;

}
