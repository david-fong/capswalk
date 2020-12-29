import { JsUtils } from "defs/JsUtils";
import type { Coord, Tile } from "floor/Tile";
import { Grid as AbstractGrid } from "floor/Grid";
type S = Coord.System.BEEHIVE;

/**
 * ### 🐝 BEES !
 *
 * ## 🐝 BEES !
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
 * [(bees)](https://giphy.com/gifs/oprah-bees-VhFps32TlNgsg)
 */
export namespace Beehive {

	/**
	 * Beehive Internal Augmented Coord
	 */
	export class IAC {

		/** 🕒 3'o'clock direction */
		public readonly dash: number;

		/** 🕔 5'o'clock direction */
		public readonly bash: number;

		public constructor(desc: IAC.Bare) {
			this.dash = desc.dash;
			this.bash = desc.bash;
			Object.freeze(this);
		}
		public toCoord(): Coord {
			// TODO.impl
			return undefined!;
		}

		public round(): IAC {
			// I'm pretty proud of this despite the fact that I don't
			// think there's anything very impressive about it.
			const floorDash = Math.floor(this.dash);
			const floorBash = Math.floor(this.bash);
			const d = floorDash - this.dash;
			const b = floorBash - this.bash;
			if (d > 2 * b) {
				return new IAC({ dash: floorDash+1, bash: floorBash   });
			} else if (d < 0.5 * b) {
				return new IAC({ dash: floorDash  , bash: floorBash+1 });
			} else if (Math.min(d, b) > 0.5) {
				return new IAC({ dash: floorDash+1, bash: floorBash+1 });
			} else {
				return new IAC({ dash: floorDash  , bash: floorBash   });
			}
		}
		public add(other: IAC.Bare): IAC {
			return new IAC({
				dash: this.dash + other.dash,
				bash: this.bash + other.bash,
			});
		}
		public sub(other: IAC.Bare): IAC {
			return new IAC({
				dash: this.dash - other.dash,
				bash: this.bash - other.bash,
			});
		}
		public mul(scalar: number): IAC {
			return new IAC({
				dash: scalar * this.dash,
				bash: scalar * this.bash,
			});
		}
	}
	export namespace IAC {
		export type Bare = Readonly<{
			dash: number;
			bash: number;
		}>;
	}
	Object.freeze(IAC);
	Object.freeze(IAC.prototype);



	/**
	 * # Beehive Grid
	 */
	export class Grid extends AbstractGrid<S> {

		public static getAmbiguityThreshold(): 18 {
			return 18;
		}

		/**
		 * @override
		 */
		public static getSizeLimits(): AbstractGrid.DimensionBounds<S> { return this.SIZE_LIMITS; }
		private static readonly SIZE_LIMITS = Object.freeze({
			dash:    Object.freeze({ min: 10, max: 50 }),
			bslash:  Object.freeze({ min: 10, max: 50 }),
			fslash:  Object.freeze({ min: 10, max: 50 }),
		});

		/**
		 */
		// TODO.design determine spec for indexing
		// Then initialize the field in the constructor
		// Also design HTML representation and initialize in Grid.Visible
		private readonly grid: TU.RoArr<TU.RoArr<Tile>>;

		public constructor(desc: AbstractGrid.CtorArgs<S>) {
			super(desc);

			// Initialize `grid`:
			const grid = undefined!;
			this.grid = Object.freeze(grid);
		}

		public write(coord: Coord, changes: Tile.Changes): void {
			// TODO.impl
		}

		public forEach(consumer: (tile: Tile, index: number) => void): void {
			let i = 0;
			for (const row of this.grid) {
				for (const tile of row) {
					consumer(tile, i++);
				}
			}
		}
		public forEachShuffled(consumer: (tile: Tile, index: number) => void): void {
			// const indices: Array<number> = new Array(this.area);
			// for (let i = 0; i < this.area; i++) {
			// 	indices[i] = i;
			// }
			// indices.sort((a,b) => Math.random() - 0.5);
			// Object.freeze(indices);
			// for (const index of indices) {
			// 	consumer(this.grid[index]!, index);
			// }
		}

		public getUntToward(intendedDest: Coord, sourceCoord: Coord): Tile {
			return undefined!;
		}
		public getUntAwayFrom(_avoidCoord: Coord, _sourceCoord: Coord): Tile {
			// return this.getUntToward(
			// 	sourceCoord.add(sourceCoord.sub(avoidCoord)),
			// 	sourceCoord,
			// );
			return undefined!;
		}

		public getDestsFromSourcesTo(originCoord: Coord): TU.RoArr<Tile> {
			return this.tileDestsFrom(originCoord, 2);
		}

		public getRandomCoordAround(origin: Coord, radius: number): Coord {
			// Note to self when I implement this:
			// Be careful about getting proper uniform random distribution!
			return undefined!;
		}

		public dist(source: Coord, dest: Coord): number {
			return undefined!;
		}

		public tileAt(coord: Coord): Tile {
			return undefined!;
		}

		public tileDestsFrom(coord: Coord, radius: number = 1): TU.RoArr<Tile> {
			const result: TU.RoArr<Tile> = [];
			return Object.freeze(result);
		}

		public tileSourcesTo(coord: Coord, radius: number = 1): TU.RoArr<Tile> {
			return undefined!;
		}

		declare public static getSpawnCoords: AbstractGrid.ClassIf<S>["getSpawnCoords"];

		public static getArea(dim: Grid.Dimensions): number {
			const shorterSide = Math.min(dim.fslash, dim.bslash);
			const longerSide  = Math.max(dim.fslash, dim.bslash);
			const width = (-1) + dim.dash + shorterSide;
			let area = 2 * shorterSide * (dim.dash + width);
			area += (longerSide - shorterSide - 1) * width;
			return area;
		}

		public static getLatticePatchDiameter(area: number): number {
			if (area < 0.25) {
				throw new RangeError("determinant of a radical will be strictly negative.");
			}
			// Given radius `r` and diameter = `1 + 2*r`, the area is
			// `1 + 6*r*(1+r)/2`. Rearrange to solve for `d` given the
			// area: `0 = 3r^2 + 3r + (1-a)`. Use quadratic formula.
			const radius = ((-3) + Math.sqrt(9 - (12 * (1 - area)))) / 6;
			return 1 + (2 * radius);
		}

		public static getRandomCoord(dimensions: Grid.Dimensions): Coord {
			return new IAC(undefined!).toCoord();
		}
	}
	export namespace Grid {
		export type Dimensions = {
			dash: number;
			bslash: number;
			fslash: number;
		};
	}
	JsUtils.protoNoEnum(Grid, "tileAt", "tileDestsFrom", "tileSourcesTo");
	Object.freeze(Grid);
	Object.freeze(Grid.prototype);
}
Object.freeze(Beehive);