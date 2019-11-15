import { HtmlIdHooks } from "src/Defs";
import { Tile, BarePos } from "src/base/Tile";
import { VisibleTile } from "src/offline/VisibleTile";

/**
 * Provides basic management of The basic 2-dimensional-array-like
 * structure containing {@link Tile}s.
 */
export abstract class Grid {

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

    public abstract createTile(x: number, y: number): Tile;



    public constructor(height: number, width: number = height) {
        if ((height <= 0) || (width  <= 0)) {
            throw new RangeError("Grid dimensions must be greater than zero.");
        }
        this.height = height;
        this.width  = width;

        const grid: Array<ReadonlyArray<Tile>> = [];
        for (let row: number = 0; row < this.height; row++) {
            const newRow: Array<Tile> = [];
            for (let col: number = 0; col < this.width; col++) {
                const newTile: Tile = this.createTile(col, row);
                newRow.push(newTile);
            }
            grid.push(newRow);
        }
        this.grid = grid;

        // Create and populate the HTML table element field:
        // (skip this step if my tiles are not displayed in a browser window)
        if (this.createTile(0, 0) instanceof VisibleTile) {
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
            document.getElementById(HtmlIdHooks.GRID).appendChild(this.domGrid);
        } else {
            this.domGrid = null;
        }

        this.reset();
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
     */
    public getTileAt(pos: BarePos): Tile {
        if (pos.x < 0 || pos.x >= this.width ||
            pos.y < 0 || pos.y >= this.height
        ) {
            throw new RangeError("Argument \"pos\" is outside the bounds of this Grid.");
        }
        return this.grid[pos.x][pos.y];
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
     */
    public getUNT(pos: BarePos, radius: number = 1): Array<Tile> {
        return this.grid.slice(
                // filter for included rows:
                Math.max(0, pos.y - radius),
                Math.min(this.height, pos.y + radius + 1),
        ).flatMap(tile => tile.slice(
                // filter for included slices of rows (columns):
                Math.max(0, pos.x - radius,
                Math.min(this.width, pos.x + radius + 1)),
        )).filter(tile => !(tile.isOccupied()));
    }

}
