
/**
 * 
 */
abstract class Grid {

    public readonly height: number;
    public readonly width:  number;

    public abstract createTile(x: number, y: number): Tile;

    /**
     * 
     */
    private readonly grid: Array<Array<Tile>>;

    public constructor(height: number, width: number = height) {
        if ((height <= 0) || (width  <= 0)) {
            throw new RangeError("Grid dimensions must be greater than zero.")
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
    }

    /**
     * Calls `::reset` for each `Tile` in this `Grid`.
     */
    public reset(): void {
        this.grid.forEach(row => row.forEach(t => t.reset()));
    }



    /**
     * 
     * @param pos Must be within the bounds of this `Grid`.
     */
    public getTileAt(pos: Pos): Tile {
        if (pos.x < 0 || pos.x >= this.width ||
            pos.y < 0 || pos.y >= this.height
        ) {
            throw new RangeError("Argument pos is outside the bounds of this Grid.");
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
        ).flatMap(t => t.slice(
                // filter for included slices of rows (columns):
                Math.max(0, pos.x - radius,
                Math.min(this.width, pos.x + radius + 1)),
        )).filter(t => !(t.isOccupied()));
    }

}
