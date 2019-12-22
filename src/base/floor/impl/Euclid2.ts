import { Coord as AbstractCoord } from "../Coord";
import { Tile } from "../Tile";
import { Grid as AbstractGrid } from "../Grid";


/**
 * 
 */
export namespace Euclid2 {

    type B = Coord.Bare;
    type S = AbstractCoord.System.EUCLID2;

    /**
     * 
     */
    export class Coord extends AbstractCoord<S> implements B {

        public readonly x: number;
        public readonly y: number;

        public constructor(desc: B) {
            super(desc);
            this.x = desc.x;
            this.y = desc.y;
            Object.freeze(this);
        }

        /**
         * @override
         */
        public equals(other: B): boolean {
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
         * @override
         */
        public originOneNorm(): number {
            return Math.abs(this.x) + Math.abs(this.y);
        }

        /**
         * @override
         */
        public originInfNorm(): number {
            return Math.max(Math.abs(this.x), Math.abs(this.y));
        }

        /**
         * @override
         */
        public originAxialAlignment(): number {
            return Math.abs(Math.abs(this.x) - Math.abs(this.y))
                / (Math.abs(this.x) + Math.abs(this.y));
        }

        /**
         * @override
         */
        public add(other: B): Coord {
            return new Coord({
                x: this.x + other.x,
                y: this.y + other.y,
            });
        }

        /**
         * @override
         */
        public sub(other: B): Coord {
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
     * 
     */
    export abstract class Grid extends AbstractGrid<S> {

        private static readonly SIZE_LIMITS = Object.freeze({
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

        protected constructor(
            coordSys: S,
            dimensions: Grid.Dimensions<S>,
            domGridHtmlIdHook = Grid.HTML_ID_HOOK,
        ) {
            super();
        }


        /**
         * @override
         */
        public getTileAt(coord: B): Tile<S> {
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
         * @override
         */
        public forEachTile(consumer: (tile: Tile<S>) => void, thisArg: object = this): void {
            this.grid.forEach((row) => row.forEach((tile) => {
                consumer(tile);
            }, thisArg), thisArg);
        }

    }

    export namespace Grid {

        export type Dimensions = {
            height: number,
            width?: number,
        };

    }

}
