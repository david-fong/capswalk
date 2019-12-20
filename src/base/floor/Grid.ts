import { Coord } from "floor/Coord";
import { Tile } from "./Tile";
import { VisibleTile } from "./VisibleTile";



/**
 * Provides basic management of The basic 2-dimensional-array-like
 * structure containing {@link Tile}s.
 */
export abstract class Grid<
    S extends Coord.System,
    B extends typeof Coord.BareImpl[S] = typeof Coord.BareImpl[S],
> {

    /**
     * Bounds are inclusive. Ie. the specified values are _just_ allowed.
     */
    public static readonly SIZE_LIMITS = Object.freeze({
        height: Object.freeze(<const>{ min: 10, max: 50, }),
        width:  Object.freeze(<const>{ min: 10, max: 50, }),
    });

    public readonly height: number;
    public readonly width:  number;

    /**
     * A 2-dimensional rectangular array with height and width following
     * their corresponding fields, containing `Tile` objects with `pos`
     * fields allowing indexing to themselves. Uses row-major ordering.
     */
    private readonly grid: ReadonlyArray<ReadonlyArray<Tile<S>>>;

    /**
     * If {@link Grid#createTile} returns an instance of {@link VisibleTile},
     * then this field is initialized with an HTML table element containing
     * all  the contents of {@link Grid#grid}. Otherwise, this field is set
     * to be `undefined`.
     */
    private readonly domGrid?: HTMLTableElement;

    public abstract createTile(desc: B): Tile<S>;



    /**
     * If requested dimensions are outside the limits requested by this
     * class, they will be truncated before being used. No error will
     * be thrown.
     * 
     * _Does not call reset._
     * 
     * @param dimensions - 
     * @param domGridHtmlIdHook - The identifier for the HTML element
     *      for this new grid to attach its {@link Grid#domGrid} to
     *      (if it exists). Any existing children of the hook-element
     *      are kicked out. Must refer to an existing element.
     */
    public constructor(
        dimensions: Grid.DimensionDesc,
        domGridHtmlIdHook = Grid.HTML_ID_HOOK,
    ) {
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

        const grid: Array<ReadonlyArray<Tile<S>>> = [];
        for (let row = 0; row < this.height; row++) {
            const newRow: Array<Tile<S>> = [];
            for (let col = 0; col < this.width; col++) {
                const newTile: Tile<S> = this.createTile({ x: col, y: row, });
                newRow.push(newTile);
            }
            grid.push(newRow);
        }
        this.grid = grid;

        // Create and populate the HTML table element field:
        // (skip this step if my tiles are not displayed in a browser window)
        if (this.createTile({ x: 0, y: 0, }) instanceof VisibleTile) {
            this.domGrid = new HTMLTableElement();
            const tBody = this.domGrid.createTBody();
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
            carrier.appendChild(this.domGrid);
        } else {
            this.domGrid = undefined;
        }
    }

    /**
     * Calls {@link Tile#reset} for each {@link Tile} in this `Grid`.
     */
    public reset(): void {
        this.forEachTile((tile) => tile.reset());
    }



    /**
     * @returns The {@link Tile} at the position in this `Grid` specified
     * by `pos`.
     * 
     * @param pos - Must be within the bounds of this `Grid`.
     * @throws `RangeError` if `pos` is not in the bounds of this `Grid`.
     */
    public getTileAt(pos: B): Tile<S> {
        if (pos.x < 0 || pos.x >= this.width ||
            pos.y < 0 || pos.y >= this.height
        ) {
            throw new RangeError("Argument \"pos\" is outside the bounds of this Grid.");
        }
        return this.grid[pos.x][pos.y];
    }

    public getNeighbouringTiles(pos: B, radius: number = 1): Array<Tile<S>> {
        return this.grid.slice(
            // filter for included rows:
            Math.max(0, pos.y - radius),
            Math.min(this.height, pos.y + radius + 1),
        ).flatMap((tile) => tile.slice(
            // filter for included slices of rows (columns):
            Math.max(0, pos.x - radius,
            Math.min(this.width, pos.x + radius + 1)),
        ));
    }

    /**
     * @returns A collection of all "Unoccupied Neighbouring Tiles"
     * within `radius` of `pos` according to {@link Pos#infNorm}.
     * {@link Tile}s for which {@link Tile#isOccupied} is `true` are
     * filtered out of the returned array. The {@link Tile} at `pos`
     * is included if it is unoccupied.
     * 
     * @param pos - The center / origin position-locator to search around.
     * @param radius - An inclusive bound on the {@link Pos#infNorm} filter.
     *      Defaults to `1`.
     */
    public getUNT(pos: B, radius: number = 1): Array<Tile<S>> {
        return this.getNeighbouringTiles(pos, radius).filter((tile) => !(tile.isOccupied()));
    }

    public forEachTile(consumer: (tile: Tile<S>) => void, thisArg: object = this): void {
        this.grid.forEach((row) => row.forEach((tile) => {
            consumer(tile);
        }, thisArg), thisArg);
    }

}



export namespace Grid {

    /**
     * Should only have one child: the main game grid's display.
     */
    export const HTML_ID_HOOK = "game-grid-host";

    /**
     * Values do not _need_ to be in range or integers. Cleaning to handle
     * such values is performed by the {@link Grid} constructor.
     */
    export type DimensionDesc = {
        height: number,
        width?: number,
    };

}
