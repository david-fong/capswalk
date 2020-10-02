import { applyMixins } from "defs/TypeDefs";
import { Coord as BaseCoord, Tile } from "../Tile";
import type { VisibleTile } from "floor/VisibleTile";
import { Grid as AbstractGrid } from "../Grid";
import { VisibleGrid, VisibleGridMixin } from "../VisibleGrid";


type S = BaseCoord.System.EUCLID2;

/**
 *
 */
export namespace Euclid2 {

    /**
     * # Euclid2 Coord
     */
    export class Coord implements BaseCoord.Abstract.Mathy<S>, Coord.Bare {

        public readonly x: number;
        public readonly y: number;

        public constructor(desc: Coord.Bare) {
            this.x = desc.x;
            this.y = desc.y;
            Object.freeze(this);
        }

        public equals(other: Coord.Bare): boolean {
            return (this.x === other.x) && (this.y === other.y);
        }

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

        public add(other: Coord.Bare): Coord {
            return new Coord({
                x: this.x + other.x,
                y: this.y + other.y,
            });
        }

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

        public static getAmbiguityThreshold(): 24 {
            return 24;
        }

        public static getSizeLimits(): AbstractGrid.DimensionBounds<S> { return this.SIZE_LIMITS; }
        private static readonly SIZE_LIMITS = Object.freeze(<const>{
            height: Object.freeze(<const>{ min: 11, max: 51, }),
            width:  Object.freeze(<const>{ min: 11, max: 51, }),
        });

        /**
         * A 2-dimensional rectangular array with height and width following
         * their corresponding fields, containing `Tile` objects with `pos`
         * fields allowing indexing to themselves. Uses _row-major_ ordering.
         */
        protected readonly grid: TU.RoArr<TU.RoArr<Tile<S>>>;

        public constructor(desc: AbstractGrid.CtorArgs<S>) {
            super(desc);

            const grid: Array<TU.RoArr<Tile<S>>> = [];
            for (let row = 0; row < this.dimensions.height; row++) {
                const newRow: Array<Tile<S>> = [];
                for (let col = 0; col < this.dimensions.width; col++) {
                    const newTile = new desc.tileClass(new Coord({ x: col, y: row, }));
                    newRow.push(newTile);
                }
                grid.push(Object.freeze(newRow));
            }
            this.grid = Object.freeze(grid);
        }

        public forEachTile(consumer: (tile: Tile<S>) => void): void {
            for (const row of this.grid) {
                for (const tile of row) {
                    consumer(tile);
                }
            }
        }
        public shuffledForEachTile(consumer: (tile: Tile<S>) => void): void {
            this.grid.flat()
            .sort((a,b) => Math.random() - 0.5)
            .forEach((tile) => consumer(tile));
        }

        public getUntToward(intendedDest: Coord.Bare, sourceCoord: Coord): Tile<S> {
            const options = this.tile.destsFrom(sourceCoord).unoccupied.get;
            if (options.length === 0) {
                return this.tile.at(sourceCoord);
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

        public getUntAwayFrom(avoidCoord: Coord, sourceCoord: Coord): Tile<S> {
            return this.getUntToward(
                sourceCoord.add(sourceCoord.sub(avoidCoord)),
                sourceCoord,
            );
        }

        public getRandomCoordAround(origin: Coord.Bare, radius: number): Coord {
            return new Coord({
                x: origin.x + Math.trunc(2 * radius * (Math.random() - 0.5)),
                y: origin.y + Math.trunc(2 * radius * (Math.random() - 0.5)),
            });
        }


        public _getTileAt(coord: Coord.Bare): Tile<S> {
            // if (coord.x < 0 || coord.x >= this.dimensions.width ||
            //     coord.y < 0 || coord.y >= this.dimensions.height
            // ) {
            //     throw RangeError("Out of bounds. No such tile exists.");
            // }
            return this.grid[coord.y][coord.x];
        }

        public _getTileDestsFrom(coord: Coord.Bare, radius: number = 1): Array<Tile<S>> {
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

        public _getTileSourcesTo(coord: Coord.Bare, radius: number = 1): Array<Tile<S>> {
            // Same behaviour as getting destinations from `coord`.
            return this._getTileDestsFrom(coord, radius);
        }

        public minMovesFromTo(source: Coord.Bare, dest: Coord.Bare): number {
            return Math.min(
                Math.abs(dest.x - source.x),
                Math.abs(dest.y - source.y),
            );
        }


        /**
         * @override
         */
        public static getSpawnCoords(
            playerCounts: TU.RoArr<number>,
            dimensions: Grid.Dimensions,
        ): TU.RoArr<TU.RoArr<Coord.Bare>> {
            const avoidSet: Array<Coord.Bare> = [];
            return playerCounts.map((numMembers: number) => {
                const teamSpawnCoords: Array<Coord.Bare> = [];
                while (numMembers > 0) {
                    let coord: Coord;
                    do {
                        coord = Grid.getRandomCoord(dimensions);
                    } while (avoidSet.find((other) => coord.equals(other)));
                    teamSpawnCoords.push(coord);
                    avoidSet.push(coord);
                    numMembers--;
                }
                return teamSpawnCoords;
            });
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
            const x = Math.floor(dimensions.width  * Math.random());
            const y = Math.floor(dimensions.height * Math.random());
            return new Coord({x,y,});
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
                const gridElem = document.createElement("div");
                gridElem.style.setProperty("--euclid2-grid-width",  this.dimensions.width.toString());
                //gridElem.style.setProperty("--euclid2-grid-height", this.dimensions.height.toString());
                for (const row of this.grid) {
                    for (const tile of row) {
                        tile._addToDom(gridElem);
                    }
                }
                this._superVisibleGrid(desc, gridElem);
            }
        }
        export interface Visible extends VisibleGridMixin<S> { };
        applyMixins(Visible, [VisibleGridMixin,]);
        Object.freeze(Visible);
        Object.freeze(Visible.prototype);
    }
    Object.freeze(Grid);
    Object.freeze(Grid.prototype);
}
Object.freeze(Euclid2);