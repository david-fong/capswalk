import { Pos } from "src/Pos";
import { Tile } from "src/base/Tile";
import { VisibleTile } from "src/offline/VisibleTile";

/**
 * 
 */
export abstract class Grid {

    public readonly height: number;
    public readonly width:  number;

    /**
     * A 2-dimensional rectangular array with height and width following
     * their corresponding fields, containing `Tile` objects with `pos`
     * fields allowing indexing to themselves. Uses row-major ordering.
     */
    protected readonly grid: Array<Array<Tile>>;

    /**
     * If `::createTile` returns an instance of `VisibleTile`, this
     * field is initialized with an HTML table element containing all
     * the contents of `grid`. Otherwise, this field is set to `null`.
     */
    protected readonly domGrid: HTMLTableElement | null;

    public abstract createTile(x: number, y: number): Tile;

    public constructor(height: number, width: number = height) {
        if ((height <= 0) || (width  <= 0)) {
            throw new RangeError("Grid dimensions must be greater than zero.");
        }
        this.height = height;
        this.width  = width;

        this.grid = [];
        for (let row: number = 0; row < this.height; row++) {
            const newRow: Array<Tile> = [];
            for (let col: number = 0; col < this.width; col++) {
                const newTile: Tile = this.createTile(col, row);
                newRow.push(newTile);
            }
            this.grid.push(newRow);
        }

        // Create and populate the HTML table element field:
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
        } else {
            this.domGrid = null;
        }

        this.reset();
    }

    /**
     * Calls `::reset` for each `Tile` in this `Grid`.
     */
    public reset(): void {
        this.grid.forEach(row => row.forEach(tile => tile.reset()));
    }



    /**
     * 
     * @param pos Must be within the bounds of this `Grid`.
     */
    public getTileAt(pos: Pos): Tile {
        if (pos.x < 0 || pos.x >= this.width ||
            pos.y < 0 || pos.y >= this.height
        ) {
            throw new RangeError("Argument \"pos\" is outside the bounds of this Grid.");
        }
        return this.grid[pos.x][pos.y];
    }
    
    /**
     * Get Unoccupied Neghbouring Tiles within one `radius` of `pos`
     * according to `Pos::infNorm`. Tiles for which `::isOccupied` is
     * `true` are filtered out of the returned array. The `Tile` at
     * `pos` is included if it is unoccupied.
     * 
     * @param pos 
     * @param radius An inclusive bound on the infNorm filter. Ie. if
     *          this argument is `zero` and the `Tile` at `pos` is not
     *          occupied, then the returned array contains only the
     *          `Tile` at `pos`.
     */
    public getUNT(pos: Pos, radius: number = 1): Array<Tile> {
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
