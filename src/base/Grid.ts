import { HtmlIdHooks } from "src/Defs";
import { BarePos, Tile } from "src/base/Tile";
import { VisibleTile } from "src/offline/VisibleTile";

/**
 * Provides basic management of The basic 2-dimensional-array-like
 * structure containing {@link Tile}s.
 */
export abstract class Grid {

    /**
     * Bounds are inclusive. Ie. the specified values are _just_ allowed.
     */
    public static readonly SIZE_LIMITS = Object.freeze(<const>{
        height: <const>{ min: <const>10, max: <const>70, },
        width:  <const>{ min: <const>10, max: <const>70, },
    });

    public readonly height: number;
    public readonly width:  number;

    /**
     * A 2-dimensional rectangular array with height and width following
     * their corresponding fields, containing `Tile` objects with `pos`
     * fields allowing indexing to themselves. Uses row-major ordering.
     */
    protected readonly grid: ReadonlyArray<ReadonlyArray<Tile>>;

    /**
     * If {@link Grid#createTile} returns an instance of {@link VisibleTile},
     * then this field is initialized with an HTML table element containing
     * all  the contents of {@link Grid#grid}. Otherwise, this field is set
     * to be `null`.
     */
    protected readonly domGrid: HTMLTableElement | null;

    public abstract createTile(pos: BarePos): Tile;



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
        dimensions: { height: number, width?: number, },
        domGridHtmlIdHook = HtmlIdHooks.GRID
    ) {
        if (!(dimensions.width)) {
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

        const grid: Array<ReadonlyArray<Tile>> = [];
        for (let row = 0; row < this.height; row++) {
            const newRow: Array<Tile> = [];
            for (let col = 0; col < this.width; col++) {
                const newTile: Tile = this.createTile({ x: col, y: row, });
                newRow.push(newTile);
            }
            grid.push(newRow);
        }
        this.grid = grid;

        // Create and populate the HTML table element field:
        // (skip this step if my tiles are not displayed in a browser window)
        if (this.createTile({ x: 0, y: 0, }) instanceof VisibleTile) {
            this.domGrid = new HTMLTableElement();
            const tBody: HTMLTableSectionElement = this.domGrid.createTBody();
            for (const row of this.grid) {
                const rowElem: HTMLTableRowElement = tBody.insertRow();
                for (const tile of row) {
                    if (tile instanceof VisibleTile) {
                        rowElem.appendChild(tile.tileCellElem);
                    } else {
                        // Should never reach here.
                        throw new TypeError("Expected a VisibleTile.");
                    }
                }
            }
            const carrier: HTMLElement = document.getElementById(domGridHtmlIdHook);
            if (!carrier) {
                throw new RangeError(`id \"${domGridHtmlIdHook}\" did not refer`
                    + `to an existing html element.`
                );
            }
            carrier.childNodes.forEach(node => carrier.removeChild(node));
            carrier.appendChild(this.domGrid);
        } else {
            this.domGrid = null;
        }
    }

    /**
     * Calls {@link Tile#reset} for each {@link Tile} in this `Grid`.
     */
    public reset(): void {
        this.grid.forEach(row => row.forEach(tile => tile.reset()));
    }



    /**
     * @returns The {@link Tile} at the position in this `Grid` specified
     * by `pos`.
     * 
     * @param pos - Must be within the bounds of this `Grid`.
     * @throws `RangeError` if `pos` is not in the bounds of this `Grid`.
     */
    public getTileAt(pos: BarePos): Tile {
        if (pos.x < 0 || pos.x >= this.width ||
            pos.y < 0 || pos.y >= this.height
        ) {
            throw new RangeError("Argument \"pos\" is outside the bounds of this Grid.");
        }
        return this.grid[pos.x][pos.y];
    }

    public getNeighbouringTiles(pos: BarePos, radius: number = 1): Array<Tile> {
        return this.grid.slice(
                // filter for included rows:
                Math.max(0, pos.y - radius),
                Math.min(this.height, pos.y + radius + 1),
        ).flatMap(tile => tile.slice(
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
    public getUNT(pos: BarePos, radius: number = 1): Array<Tile> {
        return this.getNeighbouringTiles(pos, radius).filter(tile => !(tile.isOccupied()));
    }

}
