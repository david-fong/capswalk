import { applyMixins } from 'defs/TypeDefs';
import { Coord as BaseCoord, Tile } from "../Tile";
import { Grid as AbstractGrid } from "../Grid";
import { VisibleGrid, VisibleGridMixin } from "../VisibleGrid";


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
    export class Coord implements BaseCoord.Abstract.Mathy<S>, Coord.Bare {

        /**
         * # 🕒 3'o'clock direction
         */
        public readonly dash: number;

        /**
         * # 🕔 5'o'clock direction
         */
        public readonly bash: number;

        public constructor(desc: Coord.Bare) {
            this.dash = desc.dash;
            this.bash = desc.bash;
            Object.freeze(this);
        }

        public equals(other: Coord.Bare): boolean {
            return (this.dash === other.dash) && (this.bash === other.bash);
        }

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

        public add(other: Coord.Bare): Coord {
            return new Coord({
                dash: this.dash + other.dash,
                bash: this.bash + other.bash,
            });
        }

        public sub(other: Coord.Bare): Coord {
            return new Coord({
                dash: this.dash - other.dash,
                bash: this.bash - other.bash,
            });
        }

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
    Object.freeze(Coord);
    Object.freeze(Coord.prototype);



    /**
     * # Beehive Grid
     */
    export class Grid extends AbstractGrid<S> {

        public static getAmbiguityThreshold(): 18 {
            return 18;
        }

        public static getSizeLimits(): AbstractGrid.DimensionBounds<S> { return this.SIZE_LIMITS; }
        private static readonly SIZE_LIMITS = Object.freeze({
            dash:    Object.freeze({ min: 10, max: 50, }),
            bslash:  Object.freeze({ min: 10, max: 50, }),
            fslash:  Object.freeze({ min: 10, max: 50, }),
        });

        /**
         *
         */
        // TODO.design determine spec for indexing
        // Then initialize the field in the constructor
        // Also design HTML representation and initialize in Grid.Visible
        private readonly grid: TU.RoArr<TU.RoArr<Tile<S>>>;

        public constructor(desc: AbstractGrid.CtorArgs<S>) {
            super(desc);

            // Initialize `grid`:
            const grid = undefined!;
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
            return undefined!;
        }

        public getUntAwayFrom(avoidCoord: Coord, sourceCoord: Coord): Tile<S> {
            return this.getUntToward(
                sourceCoord.add(sourceCoord.sub(avoidCoord)),
                sourceCoord,
            );
        }

        public getRandomCoordAround(origin: Coord.Bare, radius: number): Coord {
            // Note to self when I implement this:
            // Be careful about getting proper uniform random distribution!
            return undefined!;
        }


        public _getTileAt(coord: Coord.Bare): Tile<S> {
            return undefined!;
        }

        public _getTileDestsFrom(coord: Coord.Bare): Array<Tile<S>> {
            return undefined!;
        }

        public _getTileSourcesTo(coord: Coord.Bare): Array<Tile<S>> {
            return undefined!;
        }

        public minMovesFromTo(source: Coord.Bare, dest: Coord.Bare): number {
            return undefined!;
        }


        public static getSpawnCoords(
            playerCounts: TU.RoArr<number>,
            dimensions: Grid.Dimensions,
        ): TU.RoArr<TU.RoArr<Coord.Bare>> {
            return undefined!;
        }

        public static getArea(dim: Grid.Dimensions): number {
            const shorterSide = Math.min(dim.fslash, dim.bslash);
            const longerSide  = Math.max(dim.fslash, dim.bslash);
            const width = (-1) + dim.dash + shorterSide;
            let area = 2 * shorterSide * (dim.dash + width);
            area += (longerSide - shorterSide - 1) * width;
            return area;
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
            public constructor(desc: AbstractGrid.CtorArgs<S>) {
                super(desc);
                const domGrid: HTMLElement = undefined!;
                // TODO.impl Beehive VisibleGrid ctor.
                this._superVisibleGrid(desc, domGrid);
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
Object.freeze(Beehive);
