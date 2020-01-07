import { Coord as BaseCoord } from "../Coord";
import { Tile } from "../Tile";
import { Grid as AbstractGrid } from "../Grid";


/**
 * 
 */
export namespace Euclid2 {

    type S = BaseCoord.System.EUCLID2;

    /**
     * # Euclid2 Coord
     */
    class Coord extends BaseCoord.Abstract<S> implements B {

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
        // TODO: document: what is this used for?
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
        // TODO: document: what is this used for?
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



    /**
     * # Euclid2 Grid
     */
    export class Grid extends AbstractGrid<S> implements Required<Grid.Dimensions> {

        /**
         * @override
         */
        public static getAmbiguityThreshold(): 24 {
            return 24;
        }

        /**
         * @override
         */
        public static getSizeLimits(): AbstractGrid.DimensionBounds<S> { return Grid.SIZE_LIMITS; }
        private static readonly SIZE_LIMITS = Object.freeze({
            height: Object.freeze({ min: 10, max: 50, }),
            width:  Object.freeze({ min: 10, max: 50, }),
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
         * @override
         */
        public constructor(desc: AbstractGrid.CtorArgs<S>) {
            super(desc);
            this.height = desc.dimensions.height;
            this.width  = desc.dimensions.width ?? desc.dimensions.height;

            const grid: Array<ReadonlyArray<Tile<S>>> = [];
            for (let row = 0; row < this.height; row++) {
                const newRow: Array<Tile<S>> = [];
                for (let col = 0; col < this.width; col++) {
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
        public getTileAt(coord: Coord.Bare): Tile<S> {
            if (coord.x < 0 || coord.x >= this.width ||
                coord.y < 0 || coord.y >= this.height
            ) {
                throw new RangeError("Argument \"pos\" is outside the bounds of this Grid.");
            }
            return this.grid[coord.x][coord.y];
        }

        /**
         * @override
         */
        protected abstractGetNeighbouringTiles(coord: Coord.Bare, radius: number = 1): Array<Tile<S>> {
            return this.grid.slice(
                // filter for included rows:
                Math.max(0, coord.y - radius),
                Math.min(this.height, coord.y + radius + 1),
            ).flatMap((tile) => tile.slice(
                // filter for included slices of rows (columns):
                Math.max(0, coord.x - radius,
                Math.min(this.width, coord.x + radius + 1)),
            ));
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
            const options: Array<Tile<S>> = this.getUNT();
            if (!(options.includes(this.hostTile))) {
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
            // Filter out options that are not equally favorable as the
            // most favorable option. I think this is the best method:
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
            // Choose one of the most favorable using some randomness
            // weighted to follow a straight-looking path of movement.
            if (options[0].coord.x - this.coord.x === 0 || options[0].coord.y - this.coord.y === 0) {
                // (the axial option (if it exists) should be the first
                // due to the previous sort's tie-breaker.
                if (this.coord.axialAlignment(intendedDest.sub(this.coord)) - 0.5 > 0.0) {
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
        public static random(bounds: AbstractGrid.DimensionBounds<S>): Coord {
            return new Coord(undefined!);
        }

    }

    export namespace Grid {
        /**
         * If `width` is not specified, `height` is taken as its default value.
         */
        export type Dimensions = {
            height: number,
            width?: number,
        };
    }

}
