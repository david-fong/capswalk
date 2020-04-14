import { Coord as BaseCoord, Tile } from "../Tile";
import type { VisibleTile } from "floor/VisibleTile";
import { Grid as AbstractGrid } from "../Grid";
import { VisibleGrid } from "../VisibleGrid";


type S = BaseCoord.System.EUCLID2;

/**
 *
 */
export namespace Euclid2 {

    /**
     * # Euclid2 Coord
     */
    export class Coord extends BaseCoord.Abstract.Mathy<S> implements Coord.Bare {

        public readonly x: number;
        public readonly y: number;

        public constructor(desc: Coord.Bare) {
            super(desc);
            this.x = desc.x;
            this.y = desc.y;
            Object.freeze(this);
        }

        /**
         * @override
         */
        public equals(other: Coord.Bare): boolean {
            return (this.x === other.x) && (this.y === other.y);
        }

        /**
         * @override
         */
        public round(): Coord {
            return new Coord({
                x: Math.round(this.x),
                y: Math.round(this.y),
            });
        }



        /**
         * Also known as the "manhattan norm".
         *
         * _Do not override this._
         *
         * @param other - The norm is taken relative to `other`.
         * @returns The sum of the absolute values of each coordinate.
         */
        public oneNorm(other: Coord.Bare): number {
            return this.sub(other).originOneNorm();
        }

        /**
         * @override
         */
        public originOneNorm(): number {
            return Math.abs(this.x) + Math.abs(this.y);
        }

        /**
         *
         * _Do not override this._
         *
         * @param other - The norm is taken relative to `other`.
         * @returns The length of the longest dimension.
         */
        public infNorm(other: Coord.Bare): number {
            return this.sub(other).originInfNorm();
        }

        public originInfNorm(): number {
            return Math.max(Math.abs(this.x), Math.abs(this.y));
        }

        /**
         * @returns
         * A number in the range (0, 1). `One` means the x and y coordinates
         * align to the x or y axis, and `Zero` means they are plus or minus
         * 45 degrees from the x or y axis.
         *
         * You can try this yourself in [Desmos](https://www.desmos.com/calculator)
         * by pasting in the below code segment and adding a slider for `a`
         * for continuous values between zero and one.
         *
         * ```latex
         * \frac{\left|\left|x\right|-\left|y\right|\right|}{\left|x\right|+\left|y\right|}=a
         * ```
         *
         * @param other - The alignment is taken relative to `other`.
         */
        public axialAlignment(other: Coord.Bare): number {
            return this.sub(other).originAxialAlignment();
        }

        public originAxialAlignment(): number {
            return Math.abs(Math.abs(this.x) - Math.abs(this.y))
                / (Math.abs(this.x) + Math.abs(this.y));
        }

        /**
         * @override
         */
        public add(other: Coord.Bare): Coord {
            return new Coord({
                x: this.x + other.x,
                y: this.y + other.y,
            });
        }

        /**
         * @override
         */
        public sub(other: Coord.Bare): Coord {
            return new Coord({
                x: this.x - other.x,
                y: this.y - other.y,
            });
        }

        /**
         * @override
         */
        public mul(scalar: number): Coord {
            return new Coord({
                x: scalar * this.x,
                y: scalar * this.y,
            });
        }
    }

    export namespace Coord {
        export type Bare = Readonly<{
            x: number;
            y: number;
        }>;
    }
    Object.freeze(Coord);
    Object.freeze(Coord.prototype);



    /**
     * # Euclid2 Grid
     */
    export class Grid extends AbstractGrid<S> {

        /**
         * @override
         */
        public static getAmbiguityThreshold(): 24 {
            return 24;
        }

        /**
         * @override
         */
        public static getSizeLimits(): AbstractGrid.DimensionBounds<S> { return this.SIZE_LIMITS; }
        private static readonly SIZE_LIMITS = Object.freeze(<const>{
            height: Object.freeze(<const>{ min: 10, max: 50, }),
            width:  Object.freeze(<const>{ min: 10, max: 50, }),
        });

        /**
         * A 2-dimensional rectangular array with height and width following
         * their corresponding fields, containing `Tile` objects with `pos`
         * fields allowing indexing to themselves. Uses _row-major_ ordering.
         */
        protected readonly grid: TU.RoArr<TU.RoArr<Tile<S>>>;

        /**
         * @override
         */
        public constructor(desc: AbstractGrid.CtorArgs<S>) {
            super(desc);

            const grid: Array<ReadonlyArray<Tile<S>>> = [];
            for (let row = 0; row < this.dimensions.height; row++) {
                const newRow: Array<Tile<S>> = [];
                for (let col = 0; col < this.dimensions.width; col++) {
                    const newTile = new desc.tileClass(new Coord({ x: col, y: row, }));
                    newRow.push(newTile);
                }
                grid.push(newRow);
            }
            this.grid = grid;
        }

        /**
         * @override
         */
        public forEachTile(consumer: (tile: Tile<S>) => void, thisArg: object = this): void {
            this.grid.forEach((row) => row.forEach((tile) => {
                consumer(tile);
            }, thisArg), thisArg);
        }

        /**
         * @override
         */
        public getUntToward(sourceCoord: Coord, intendedDest: Coord.Bare): Tile<S> {
            const options = this.tile.destsFrom(sourceCoord).unoccupied.get;
            if (!(options.some((tile) => tile.coord.equals(sourceCoord)))) {
                // This should never happen. It is here as a reminder.
                throw new Error("Caller code didn't break the upward occupancy link.");
            }
            if (options.length === 1) {
                // Minor optimization:
                return options[0];
            }
            options.sort((tileA, TileB) => {
                // Break (some) ties by one-norm:
                return tileA.coord.oneNorm(intendedDest) - TileB.coord.oneNorm(intendedDest);
            }).sort((tileA, TileB) => {
                // Break (some) ties by one-norm:
                return tileA.coord.infNorm(intendedDest) - TileB.coord.infNorm(intendedDest);
            });
            // Filter out options that are not equally favourable as the
            // most favourable option. I think this is the best method:
            // Note: it is safe to start at index `1` because of the
            // above short-circuit if `options.length === 1`.
            for (let i = 1; i < options.length; i++) {
                if (options[i].coord.infNorm(intendedDest) > options[0].coord.infNorm(intendedDest)) {
                    options.splice(i);
                    break;
                }
            }
            if (options.length === 1) {
                // Minor optimization:
                return options[0];
            }
            // Choose one of the most favourable using some randomness
            // weighted to follow a straight-looking path of movement.
            if (options[0].coord.x - sourceCoord.x === 0 || options[0].coord.y - sourceCoord.y === 0) {
                // (the axial option (if it exists) should be the first
                // due to the previous sort's tie-breaker.
                if (sourceCoord.axialAlignment(sourceCoord.sub(intendedDest)) - 0.5 > 0.0) {
                    // The path to the intended destination is aligned more
                    // with the x or y axis than they are with those axes
                    // rotated 45 degrees.
                    return options[0];
                } else {
                    // Ignore the axial option in further computations:
                    options.shift();
                }
            }
            // Choose a random non-axial option:
            return options[Math.floor(options.length * Math.random())];
        }


        /**
         * @override
         */
        public __getTileAt(coord: Coord.Bare): Tile<S> {
            if (coord.x < 0 || coord.x >= this.dimensions.width ||
                coord.y < 0 || coord.y >= this.dimensions.height
            ) {
                throw new RangeError("Out of bounds. No such tile exists.");
            }
            return this.grid[coord.y][coord.x];
        }

        /**
         * @override
         */
        public __getTileDestsFrom(coord: Coord.Bare, radius: number = 1): Array<Tile<S>> {
            let t = coord.y - radius;
            let b = coord.y + radius + 1;
            let l = coord.x - radius;
            let r = coord.x + radius + 1;
            if (t >= this.dimensions.height || b < 0
             || l >= this.dimensions.width  || r < 0) return [];
            return this.grid.slice(
                // filter for included rows:
                Math.max(0, t),
                Math.min(this.dimensions.height, b),
            ).flatMap((gridRow) => gridRow.slice(
                // filter for included slices of rows (columns):
                Math.max(0, l),
                Math.min(this.dimensions.width, r),
            ));
        }

        /**
         * @override
         */
        public __getTileSourcesTo(coord: Coord.Bare, radius: number = 1): Array<Tile<S>> {
            // Same behaviour as getting destinations from `coord`.
            return this.__getTileDestsFrom(coord, radius);
        }


        /**
         * @override
         */
        public static getSpawnCoords(
            playerCounts: number,
            dimensions: Grid.Dimensions,
        ):  ReadonlyArray<Coord.Bare> {
            return [{x:0,y:0,}];

            // TODO.impl A proper, nice looking version of this.
            //
            //
            //
        }

        /**
         * @override
         */
        public static getArea(dim: Grid.Dimensions): number {
            return dim.height * dim.width;
        }

        /**
         * @override
         */
        public static getRandomCoord(dimensions: Grid.Dimensions): Coord {
            return new Coord(undefined!);
        }
    }

    export namespace Grid {
        /**
         * If `width` is not specified, `height` is taken as its default value.
         */
        export type Dimensions = {
            height: number,
            width:  number,
        };

        export class Visible extends Grid implements VisibleGrid<S> {

            /**
             * @override
             */
            declare protected readonly grid: TU.RoArr<TU.RoArr<VisibleTile<S>>>;

            public constructor(desc: AbstractGrid.CtorArgs<S>) {
                super(desc);
                const domGrid = document.createElement("table");
                const tBody = domGrid.createTBody();
                for (const row of this.grid) {
                    const rowElem = tBody.insertRow();
                    for (const tile of row) {
                        rowElem.appendChild(tile.tileCellElem);
                    }
                }
                const gridParentElement = document.getElementById(desc.domGridHtmlIdHook);
                if (!gridParentElement) {
                    throw new RangeError(`The ID \"${desc.domGridHtmlIdHook}\"`
                    + ` did not refer to an existing html element.`
                    );
                }
                // remove all child elements and then append the new grid:
                gridParentElement.childNodes.forEach((node) => gridParentElement.removeChild(node));
                gridParentElement.appendChild(domGrid);
            }
        }
    }
    Object.freeze(Grid);
    Object.freeze(Grid.prototype);

}
Object.freeze(Euclid2);
