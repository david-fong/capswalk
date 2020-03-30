import { Coord as BaseCoord, Tile } from "../Tile";
import type { Player } from "utils/TypeDefs";
import { Grid as AbstractGrid } from "../Grid";
import type { VisibleGrid } from "../VisibleGrid";


type S = BaseCoord.System.BEEHIVE;

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

    /**
     * # Beehive Coord
     */
    export class Coord extends BaseCoord.Abstract.Mathy<S> implements Coord.Bare {

        /**
         * # 🕒 3'o'clock direction
         */
        public readonly dash: number;

        /**
         * # 🕔 5'o'clock direction
         */
        public readonly bash: number;

        public constructor(desc: Coord.Bare) {
            super(desc);
            this.dash = desc.dash;
            this.bash = desc.bash;
            Object.freeze(this);
        }

        /**
         * @override
         */
        public equals(other: Coord.Bare): boolean {
            return (this.dash === other.dash) && (this.bash === other.bash);
        }

        /**
         * @override
         */
        public round(): Coord {
            // I'm pretty proud of this despite the fact that I don't
            // think there's anything very impressive about it.
            const floorDash = Math.floor(this.dash);
            const floorBash = Math.floor(this.bash);
            const d = floorDash - this.dash;
            const b = floorBash - this.bash;
            if (d > 2 * b) {
                return new Coord({ dash: floorDash+1, bash: floorBash  , });
            } else if (d < 0.5 * b) {
                return new Coord({ dash: floorDash  , bash: floorBash+1, });
            } else if (Math.min(d, b) > 0.5) {
                return new Coord({ dash: floorDash+1, bash: floorBash+1, });
            } else {
                return new Coord({ dash: floorDash  , bash: floorBash  , });
            }
        }

        /**
         * @override
         */
        public add(other: Coord.Bare): Coord {
            return new Coord({
                dash: this.dash + other.dash,
                bash: this.bash + other.bash,
            });
        }

        /**
         * @override
         */
        public sub(other: Coord.Bare): Coord {
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
    export class Grid extends AbstractGrid<S> {

        /**
         * @override
         */
        public static getAmbiguityThreshold(): 18 {
            return 18;
        }

        /**
         * @override
         */
        public static getSizeLimits(): AbstractGrid.DimensionBounds<S> { return this.SIZE_LIMITS; }
        private static readonly SIZE_LIMITS = Object.freeze({
            dash:    Object.freeze({ min: 10, max: 50, }),
            bslash:  Object.freeze({ min: 10, max: 50, }),
            fslash:  Object.freeze({ min: 10, max: 50, }),
        });

        /**
         *
         */
        // TODO: determine spec for indexing
        private readonly grid: ReadonlyArray<ReadonlyArray<Tile<S>>>;

        /**
         * @override
         */
        public constructor(desc: AbstractGrid.CtorArgs<S>) {
            super(desc);

            // TODO: initialize `grid`.
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
            return undefined!;
        }


        /**
         * @override
         */
        public __getTileAt(coord: Coord.Bare): Tile<S> {
            return undefined!;
        }

        /**
         * @override
         */
        public __getTileDestsFrom(coord: Coord.Bare): Array<Tile<S>> {
            return undefined!;
        }

        /**
         * @override
         */
        public __getTileSourcesTo(coord: Coord.Bare): Array<Tile<S>> {
            return undefined!;
        }


        /**
         * @override
         */
        public static getSpawnCoords(
            playerCounts: Player.Bundle.Counts,
            dimensions: Grid.Dimensions,
        ): Player.Bundle<Coord.Bare> {
            return undefined!;
        }

        /**
         * @override
         */
        public static getRandomCoord(dimensions: Grid.Dimensions): Coord {
            return new Coord(undefined!);
        }
    }

    export namespace Grid {
        export type Dimensions = {
            dash: number;
            bslash: number;
            fslash: number;
        };

        export class Visible extends Grid implements VisibleGrid<S> {
            ;
            public constructor(desc: AbstractGrid.CtorArgs<S>) {
                super(desc);
            }
        }
    }

}
