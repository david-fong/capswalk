import { JsUtils } from "defs/JsUtils";
import type { Coord as BaseCoord, Coord, Tile } from "floor/Tile";
import { TileGetter, Grid as AbstractGrid } from "floor/Grid";
type S = BaseCoord.System.W_EUCLID2;

/**
 * Edges are wrapped.
 */
export namespace WrappedEuclid2 {

	/**
	 * Euclid2 Internal Augmented Coord
	 *
	 * Immutable.
	 */
	export class IAC {

		public readonly x: number;
		public readonly y: number;

		public constructor(desc: IAC.Bare) {
			Object.freeze(Object.assign(this, desc));
		}
		public static from(coord: Coord, dimensions: Grid.Dimensions): IAC {
			return new IAC({x: coord % dimensions.width, y: Math.floor(coord / dimensions.width)});
		}

		public toCoord(dimensions: Grid.Dimensions): Coord {
			return (this.y * dimensions.width) + this.x;
		}

		public _equals(other: IAC.Bare): boolean {
			return (this.x === other.x) && (this.y === other.y);
		}
		public round(): IAC {
			return new IAC({
				x: Math.round(this.x),
				y: Math.round(this.y),
			});
		}

		/**
		 * Also known as the "manhattan norm".
		 *
		 * @final _Do not override this._
		 * @param other - The norm is taken relative to `other`.
		 * @returns The sum of the absolute values of each coordinate.
		 */
		// TODO.impl make this an instance method of Grid taking two arguments.
		public oneNorm(other: IAC.Bare): number {
			return this.sub(other).originOneNorm();
			// TODO.impl find minimal value considering wrapped edges. If ia and ib are sorted, only four possibilities need to be checked.
		}

		// TODO.impl make this an instance method of Grid taking one argument.
		public originOneNorm(): number {
			return Math.abs(this.x) + Math.abs(this.y);
		}

		/**
		 * @final _Do not override this._
		 * @returns The length of the longest dimension.
		 */
		// TODO.impl make this an instance method of Grid taking two arguments.
		public infNorm(other: IAC.Bare): number {
			// TODO.impl find minimal value considering wrapped edges.
			return this.sub(other).originInfNorm();
		}

		// TODO.impl make this an instance method of Grid taking one argument.
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
		public axialAlignment(other: IAC.Bare): number {
			return this.sub(other).originAxialAlignment();
		}

		public originAxialAlignment(): number {
			return Math.abs(Math.abs(this.x) - Math.abs(this.y))
				/ (Math.abs(this.x) + Math.abs(this.y));
		}

		public add(other: IAC.Bare): IAC {
			return new IAC({
				x: this.x + other.x,
				y: this.y + other.y,
			});
		}
		public sub(other: IAC.Bare): IAC {
			return new IAC({
				x: this.x - other.x,
				y: this.y - other.y,
			});
		}
		public mul(scalar: number): IAC {
			return new IAC({
				x: scalar * this.x,
				y: scalar * this.y,
			});
		}
	}
	export namespace IAC {
		export type Bare = Readonly<{
			x: number;
			y: number;
		}>;
	}
	Object.freeze(IAC);
	Object.freeze(IAC.prototype);



	/**
	 * Euclid2 Grid
	 */
	export class Grid extends AbstractGrid<S> {

		public static getAmbiguityThreshold(): 24 {
			return 24;
		}

		public static getSizeLimits(): AbstractGrid.DimensionBounds<S> { return this.SIZE_LIMITS; }
		private static readonly SIZE_LIMITS = JsUtils.deepFreeze(<const>{
			height: <const>{ min: 11, max: 51 },
			width:  <const>{ min: 11, max: 51 },
		});

		/**
		 * A 2-dimensional rectangular array with height and width following
		 * their corresponding fields, containing `Tile` objects with `pos`
		 * fields allowing indexing to themselves. Uses _row-major_ ordering.
		 */
		protected readonly grid: TU.RoArr<Tile>;

		public constructor(desc: AbstractGrid.CtorArgs<S>) {
			super(desc);

			const grid: TU.RoArr<Tile> = [];
			// TODO.impl
			this.grid = Object.freeze(grid);
		}

		public forEachTile(consumer: (tile: Tile, index: number) => void): void {
			this.grid.forEach(consumer);
		}
		public shuffledForEachTile(consumer: (tile: Tile) => void): void {
			this.grid.slice()
			.sort((a,b) => Math.random() - 0.5)
			.forEach((tile) => consumer(tile));
		}

		public getUntToward(intendedDest: Coord, sourceCoord: Coord): Tile {
			const options = this.tile.destsFrom(sourceCoord).unoccupied.get
			.map((tile) => { const isc = IAC.from(tile.coord); return {
				tile, isc, infNorm: isc.oneNorm(intendedDest)
			}}); // TODO.impl continue optimizing.
			if (options.length === 0) {
				return this._getTileAt(sourceCoord);
			}
			options.sort((ta, tb) => {
				// Break (some) ties by one-norm:
				return ta.coord.oneNorm(intendedDest) - tb.coord.oneNorm(intendedDest);
			}).sort((ta, tb) => {
				// Break (some) ties by inf-norm:
				return ta.coord.infNorm(intendedDest) - tb.coord.infNorm(intendedDest);
			});
			const best = options[0]!;
			// Filter out options that are not equally favourable as the
			// most favourable option. I think this is the best method:
			// Note: it is safe to start at index `1` because of the
			// above short-circuit if `options.length === 1`.
			for (let i = 1; i < options.length; i++) {
				if (options[i]!.coord.infNorm(intendedDest) > best.coord.infNorm(intendedDest)) {
					options.splice(i);
					break;
				}
			}
			if (options.length === 1) {
				// Minor optimization:
				return options[0]!;
			}
			// Choose one of the most favourable using some randomness
			// weighted to follow a straight-looking path of movement.
			if (best.coord.x - sourceCoord.x === 0 || best.coord.y - sourceCoord.y === 0) {
				// (the axial option (if it exists) should be the first
				// due to the previous sort's tie-breaker.
				if (sourceCoord.axialAlignment(sourceCoord.sub(intendedDest)) - 0.5 > 0.0) {
					// The path to the intended destination is aligned more
					// with the x or y axis than they are with those axes
					// rotated 45 degrees.
					return best;
				} else {
					// Ignore the axial option in further computations:
					options.shift();
				}
			}
			// Choose a random non-axial option:
			return options[Math.floor(options.length * Math.random())]!;
		}

		public getUntAwayFrom(avoidCoord: Coord, sourceCoord: Coord): Tile {
			return this.getUntToward(
				sourceCoord.add(sourceCoord.sub(avoidCoord)),
				sourceCoord,
			);
		}

		public getDestsFromSourcesTo(originCoord: Coord): Array<Tile> {
			return this._getTileDestsFrom(originCoord, 2);
		}

		public getRandomCoordAround(origin: Coord, radius: number): Coord {
			return new IAC({
				x: origin.x + Math.trunc(2 * radius * (Math.random() - 0.5)),
				y: origin.y + Math.trunc(2 * radius * (Math.random() - 0.5)),
			}).toCoord(this.dimensions);
		}

		/** @see TileGetter.Source */
		public _getTileAt(coord: Coord): Tile {
			return this.grid[coord]!;
		}

		/** @see TileGetter.Source */
		public _getTileDestsFrom(coord: Coord, radius: number = 1): Array<Tile> {
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
			).map((gridRow) => gridRow.slice(
				// filter for included slices of rows (columns):
				Math.max(0, l),
				Math.min(this.dimensions.width, r),
			));
		}

		/** @see TileGetter.Source */
		public _getTileSourcesTo = Grid.prototype._getTileDestsFrom;

		public minMovesFromTo(source: Coord, dest: Coord): number {
			return Math.min(
				Math.abs(dest.x - source.x),
				Math.abs(dest.y - source.y),
			);
		}


		public static getSpawnCoords(
			playerCounts: TU.RoArr<number>,
			dimensions: Grid.Dimensions,
		): TU.RoArr<TU.RoArr<Coord>> {
			const avoidSet: Array<Coord> = [];
			return playerCounts.map((numMembers: number) => {
				const teamSpawnCoords: Array<Coord> = [];
				while (numMembers > 0) {
					let coord: Coord;
					do {
						coord = Grid.getRandomCoord(dimensions);
					} while (avoidSet.find((other) => coord === other));
					teamSpawnCoords.push(coord);
					avoidSet.push(coord);
					numMembers--;
				}
				return teamSpawnCoords;
			});
		}

		public static getArea(dim: Grid.Dimensions): number {
			return dim.height * dim.width;
		}

		public static getDiameterOfLatticePatchHavingArea(area: number): number {
			return Math.sqrt(area);
		}

		public static getRandomCoord(dimensions: Grid.Dimensions): Coord {
			const x = Math.floor(dimensions.width  * Math.random());
			const y = Math.floor(dimensions.height * Math.random());
			return (y * dimensions.width) + x;
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
	}
	JsUtils.protoNoEnum(Grid, "_getTileAt", "_getTileDestsFrom", "_getTileSourcesTo");
	Object.freeze(Grid);
	Object.freeze(Grid.prototype);
}
Object.freeze(WrappedEuclid2);