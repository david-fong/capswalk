import { Coord } from "./Coord";
import { Tile } from "./Tile";
import { VisibleTile } from "./VisibleTile";
import { Euclid2 } from "./impl/Euclid2";
import { Beehive } from "./impl/Beehive";


/**
 * A Collection of Tiles.
 */
export abstract class Grid<S extends Coord.System> {

    /**
     * Bounds are inclusive. Ie. the specified values are _just_ allowed.
     * 
     * Bounds must be strictly positive.
     */
    public abstract GET_SIZE_LIMITS(): Grid.DimensionBounds<S>;



    /**
     * _Does not call reset._
     * 
     * @param desc -
     */
    protected constructor(desc: Grid.CtorArgs<S>) {
        if (!dimensions.width) {
            dimensions.width = dimensions.height;
        }
        this.height = Math.round(Math.min(
            Math.max(
                dimensions.height,
                Grid.SIZE_LIMITS.height.min,
            ),
            Grid.SIZE_LIMITS.height.max,
        ));
        this.width = Math.round(Math.min(
            Math.max(
                dimensions.width,
                Grid.SIZE_LIMITS.width.min,
            ),
            Grid.SIZE_LIMITS.width.max,
        ));

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
            const carrier = document.getElementById(domGridHtmlIdHook);
            if (!carrier) {
                throw new RangeError(`The ID \"${domGridHtmlIdHook}\" did not refer`
                    + `to an existing html element.`
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
     * `coord`.
     * 
     * @param coord - Must be within the bounds of this `Grid`.
     * @param radius - Defaults to `1`.
     * @throws `RangeError` if `coord` is not in the bounds of this `Grid`.
     */
    public abstract getTileAt(coord: Coord.Ish<S>): Tile<S>;

    public abstract getNeighbouringTiles(coord: Coord.Ish<S>, radius?: number): Array<Tile<S>>;

    /**
     * @returns A collection of all "Unoccupied Neighbouring Tiles"
     * within `radius` of `coord` according to {@link Pos#infNorm}.
     * {@link Tile}s for which {@link Tile#isOccupied} is `true` are
     * filtered out of the returned array. The {@link Tile} at `coord`
     * is included if it is unoccupied.
     * 
     * @param coord - The center / origin position-locator to search around.
     * @param radius - An inclusive bound on the {@link Pos#infNorm} filter.
     *      Defaults to `1`.
     */
    public getUNT(coord: Coord.Ish<S>, radius: number = 1): Array<Tile<S>> {
        return this.getNeighbouringTiles(coord, radius).filter((tile) => !(tile.isOccupied()));
    }

    public abstract forEachTile(consumer: (tile: Tile<S>) => void, thisArg?: object): void;

}



export namespace Grid {

    /**
     * Should only have one child: the main game grid's display.
     */
    export const DEFAULT_HTML_ID_HOOK = "game-grid-host";

    /**
     * Values do not _need_ to be in range or integers.
     */
    export type Dimensions<S extends Coord.System>
        = S extends Coord.System.EUCLID2 ? Euclid2.Grid.Dimensions
        : S extends Coord.System.BEEHIVE ? Beehive.Grid.Dimensions
        : never;

    const Constructors = Object.freeze(<const>{
        [ Coord.System.EUCLID2 ]: Euclid2.Grid,
        [ Coord.System.BEEHIVE ]: Beehive.Grid,
    });
    // Will err if the extension's constructor is not compatible.
    Constructors as Readonly<{[S in Coord.System]: ConstructorType<S>;}>;

    // ==============================================================
    // Note: The below exports do not require any modificaions with
    // the additions of new coordinate systems.
    // ==============================================================

    type ConstructorType<S extends Coord.System> = { new(desc: CtorArgs<S>): Grid<S> };

    export type CtorArgs<S extends Coord.System> = {
        dimensions: Dimensions<S>;
        tileClass: Tile.ConstructorType<S>;
        domGridHtmlIdHook?: string;
    };

    /**
     * @returns
     * A Grid of the specified system according to the given
     * arguments. The mapping in `Constructors` is not statically
     * checked here because I can't get that to work, so just make
     * sure to sanity check that it works at runtime.
     * 
     * @param coordSys -
     * @param ctorArgs -
     */
    export const of = <S extends Coord.System>(coordSys: S, ctorArgs: CtorArgs<S>): Grid<S> => {
        const ctor = (Constructors)[coordSys] as unknown as ConstructorType<S>;
        return new (ctor)(ctorArgs);
    };

    export type DimensionBounds<S extends Coord.System> = Readonly<{
        [ P in keyof Required<Dimensions<S>> ]: Readonly<{
            min: number;
            max: number;
        }>;
    }>;

}
