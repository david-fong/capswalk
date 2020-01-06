import { Coord as BaseCoord } from "../Coord";
import { Tile } from "../Tile";
import { Grid as AbstractGrid } from "../Grid";


/**
 * # 🐝 BEES !
 * 
 * # 🐝 BEES !
 * 
 * # 🐝 BEES !
 * 
 * ```text
 *   ___   ___
 *  //  \_//  \__
 *  \\__/  \__/  \
 *     \\__/ \\__/
 * ```
 * 
 * 
 * [(bees)](https://giphy.com/gifs/oprah-bees-VhFps32TlNgsg)
 */
export namespace Beehive {

    type B = Coord.Bare;
    type S = BaseCoord.System.BEEHIVE;

    /**
     * # Beehive Coord
     */
    class Coord extends BaseCoord.Abstract<S> implements B {

        /**
         * # 🕒 3'o'clock direction
         */
        public readonly dash: number;

        /**
         * # 🕔 5'o'clock direction
         */
        public readonly bash: number;

        public constructor(desc: B) {
            super(desc);
            this.dash  = desc.dash;
            this.bash = desc.bash;
            Object.freeze(this);
        }

        /**
         * @override
         */
        public equals(other: B): boolean {
            return (this.dash === other.dash) && (this.bash === other.bash);
        }

        /**
         * @override
         */
        public round(): Coord {
            // TODO: is this correct? I don't think so...
            return new Coord({
                dash: Math.round(this.dash),
                bash: Math.round(this.bash),
            });
        }

        /**
         * @override
         */
        public originOneNorm(): number {
            return 0; // TODO
        }

        /**
         * @override
         */
        public originInfNorm(): number {
            return 0; // TODO
        }

        /**
         * @override
         */
        public originAxialAlignment(): number {
            return 0; // TODO
        }

        /**
         * @override
         */
        public add(other: B): Coord {
            return new Coord({
                dash: this.dash + other.dash,
                bash: this.bash + other.bash,
            });
        }

        /**
         * @override
         */
        public sub(other: B): Coord {
            return new Coord({
                dash: this.dash - other.dash,
                bash: this.bash - other.bash,
            });
        }

        /**
         * @override
         */
        public mul(scalar: number): Coord {
            return new Coord({
                dash: scalar * this.dash,
                bash: scalar * this.bash,
            });
        }
    }

    export namespace Coord {
        export type Bare = Readonly<{
            dash: number;
            bash: number;
        }>;
    }



    /**
     * # Beehive Grid
     */
    export class Grid extends AbstractGrid<S> implements Required<Grid.Dimensions> {

        /**
         * @override
         */
        public static getAmbiguityThreshold(): 18 {
            return 18;
        }

        /**
         * @override
         */
        public static getSizeLimits(): AbstractGrid.DimensionBounds<S> { return Grid.SIZE_LIMITS; }
        private static readonly SIZE_LIMITS = Object.freeze({
            dash:    Object.freeze(<const>{ min: 10, max: 50, }),
            bslash:  Object.freeze(<const>{ min: 10, max: 50, }),
            fslash:  Object.freeze(<const>{ min: 10, max: 50, }),
        });

        public readonly dash: number;
        public readonly bslash: number;
        public readonly fslash: number;

        //
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
            this.dash = desc.dimensions.dash;
            this.bslash = desc.dimensions.bslash ?? desc.dimensions.dash;
            this.fslash = desc.dimensions.fslash ?? desc.dimensions.dash;

            // TODO: initialize `grid`.
        }


        /**
         * @override
         */
        public getTileAt(coord: B): Tile<S> {
            return undefined!;
        }

        /**
         * @override
         */
        public getNeighbouringTiles(coord: B, radius: number = 1): Array<Tile<S>> {
            return undefined!;
            // return this.grid.slice(
            //     // filter for included rows:
            //     Math.max(0, pos.y - radius),
            //     Math.min(this.height, pos.y + radius + 1),
            // ).flatMap((tile) => tile.slice(
            //     // filter for included slices of rows (columns):
            //     Math.max(0, pos.x - radius,
            //     Math.min(this.width, pos.x + radius + 1)),
            // ));
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
        /**
         * If `bslash` or `fslash` are not specified, they default to `dash`.
         */
        export type Dimensions = {
            dash: number;
            bslash?: number;
            fslash?: number;
        };
    }

}
