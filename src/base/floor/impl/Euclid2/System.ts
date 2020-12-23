import { JsUtils } from "defs/JsUtils";
import type { Coord as BaseCoord, Coord, Tile } from "floor/Tile";
import { Grid as AbstractGrid } from "floor/Grid";
import { Player } from "base/defs/TypeDefs";
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
		public static from(dimensions: Grid.Dimensions, coord: Coord): IAC {
			return new IAC({x: coord % dimensions.width, y: Math.floor(coord / dimensions.width)});
		}
		public toCoord(dimensions: Grid.Dimensions): Coord {
			return (this.y * dimensions.width) + this.x;
		}

		public static distX(dim: Grid.Dimensions, i1: IAC.Bare, i2: IAC.Bare): {
			dist: number, wrap: boolean,
		} {
			let dist = Math.abs(i1.x - i2.x);
			if (dist < dim.width / 2) return { dist, wrap: false };
			return { dist: dim.width - dist, wrap: true };
		}
		public static distY(dim: Grid.Dimensions, i1: IAC.Bare, i2: IAC.Bare): {
			dist: number, wrap: boolean,
		} {
			let dist = Math.abs(i1.y - i2.y);
			if (dist < dim.height / 2) return { dist, wrap: false };
			return { dist: dim.height - dist, wrap: true };
		}
		public static oneNorm(dim: Grid.Dimensions, i1: IAC.Bare, i2: IAC.Bare): {
			norm: number, wrapX: boolean, wrapY: boolean,
		} {
			const dX = IAC.distX(dim,i1,i2), dY = IAC.distY(dim,i1,i2);
			return { norm: dX.dist + dY.dist, wrapX: dX.wrap, wrapY: dY.wrap };
		}
		public static infNorm(dim: Grid.Dimensions, i1: IAC.Bare, i2: IAC.Bare): {
			norm: number, wrapX: boolean, wrapY: boolean,
		} {
			const dX = IAC.distX(dim,i1,i2), dY = IAC.distY(dim,i1,i2);
			return { norm: Math.max(dX.dist, dY.dist), wrapX: dX.wrap, wrapY: dY.wrap };
		}
		/**
		 * @returns
		 * A number in the range (0, 1). `One` means the x and y
		 * coordinates align to the x or y axis, and `Zero` means they
		 * are 45 degrees from the x or y axis.
		 *
		 * ```latex
		 * \frac{\left|\left|x\right|-\left|y\right|\right|}{\left|x\right|+\left|y\right|}=a
		 * ```
		 */
		public static axialAlignment(dim: Grid.Dimensions, _i1: Coord, _i2: Coord): number {
			const i1 = IAC.from(dim, _i1), i2 = IAC.from(dim, _i2);
			const dX = IAC.distX(dim,i1,i2), dY = IAC.distY(dim,i1,i2);
			return (Math.abs(dX.dist - dY.dist)) / (dX.dist + dY.dist);
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
		export type Bare = {
			readonly x: number;
			readonly y: number;
		};
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

		protected readonly grid: TU.RoArr<Tile>;

		protected readonly iacCache: TU.RoArr<IAC>;

		public constructor(desc: AbstractGrid.CtorArgs<S>) {
			super(desc);

			const grid: Array<Tile> = [];
			for (let y = 0; y < this.dimensions.height; y++) {
				for (let x = 0; x < this.dimensions.width; x++) {
					const tile: Tile = {
						coord: (y * this.dimensions.width) + x,
						occId: Player.Id.NULL,
						health: 0, char: "", seq: "",
					};
					grid.push(tile);
				}
			}
			this.grid = Object.freeze(grid);

			const iacCache = [];
			for (let y = 0; y < desc.dimensions.height; y++) {
				for (let x = 0; x < desc.dimensions.width; x++) {
					iacCache.push(new IAC({x,y}));
				}
			}
			this.iacCache = Object.freeze(iacCache);
			JsUtils.instNoEnum(this as Grid, "iacCache");
			JsUtils.propNoWrite(this as Grid, "grid", "iacCache");
		}

		public editTile(coord: Coord, changes: Tile.Changes): void {
			Object.assign(this.grid[coord], changes);
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
			.map((tile) => {
				const tileIac = this.iacCache[tile.coord]!;
				const destIac = this.iacCache[intendedDest]!;
				return {
					tile, iac: tileIac,
					infNorm: IAC.infNorm(this.dimensions, tileIac, destIac).norm,
					oneNorm: IAC.oneNorm(this.dimensions, tileIac, destIac).norm,
				};
			});
			if (options.length === 0) {
				return this._getTileAt(sourceCoord);
			}
			options.sort((ta, tb) =>  ta.infNorm - tb.infNorm);
			options.length = 3;
			options.sort((ta, tb) => ta.oneNorm - tb.oneNorm);
			const best = options[0]!;
			// Filter out non-optimal options:
			for (let i = 1; i < options.length; i++) {
				if (options[i]!.infNorm > best.infNorm) {
					options.splice(i);
					break;
				}
			}
			if (options.length === 1) {
				// Minor optimization:
				return best.tile;
			}
			// Choose one of the most favourable using some randomness
			// weighted to follow a straight-looking path of movement.
			if (best.infNorm === best.oneNorm) {
				// (the axial option (if it exists) should be the first
				// due to the previous sort's tie-breaker.
				if (IAC.axialAlignment(this.dimensions, sourceCoord, intendedDest) > 0.5) {
					// The path to the intended destination is aligned more
					// with the x or y axis than they are with those axes
					// rotated 45 degrees.
					return best.tile;
				} else {
					// Ignore the axial option in further computations:
					options.shift();
				}
			}
			// Choose a random non-axial option:
			return options[Math.floor(options.length * Math.random())]!.tile;
		}
		public getUntAwayFrom(_avoidCoord: Coord, _sourceCoord: Coord): Tile {
			const avoidCoord  = this.iacCache[_avoidCoord]!;
			const sourceCoord = this.iacCache[_sourceCoord]!;
			return this.getUntToward(
				sourceCoord.add(sourceCoord.sub(avoidCoord)).toCoord(this.dimensions),
				_sourceCoord,
			);
		}

		public getDestsFromSourcesTo(originCoord: Coord): Array<Tile> {
			return this._getTileDestsFrom(originCoord, 2);
		}

		public getRandomCoordAround(_origin: Coord, radius: number): Coord {
			const origin = this.iacCache[_origin]!;
			return new IAC({
				x: origin.x + Math.trunc(2 * radius * (Math.random() - 0.5)),
				y: origin.y + Math.trunc(2 * radius * (Math.random() - 0.5)),
			}).toCoord(this.dimensions);
		}

		public dist(source: Coord, dest: Coord): number {
			return IAC.infNorm(this.dimensions,
				this.iacCache[source]!,
				this.iacCache[dest]!,
			).norm;
		}

		public _getTileAt(coord: Coord): Tile {
			return Object.assign({}, this.grid[coord]!);
		}
		public _getTileDestsFrom(coord: Coord, radius: number = 1): Array<Tile> {
			const dim = this.dimensions;
			const iac = this.iacCache[coord]!;
			let wrapX = false, wrapY = false;
			let t = (iac.y - radius); if (t < 0) { t += dim.height; wrapY = true; }
			let b = (iac.y + radius) % dim.height;
			let l = (iac.x - radius); if (l < 0) { l += dim.width; wrapX = true; }
			let r = (iac.x + radius) % dim.width;
			const dests: Array<Tile> = [];
			if (wrapX) {
				const _t = t * dim.width;
				dests.push(...this.grid.slice(_t, _t+r+1));
				if (wrapY) {
					dests.push(...this.grid.slice(0, r+1));
				}
			}

			const b1 = wrapY ? dim.height : b;
			const sliceLength = (radius * 2) + 1;
			for (let y = t; y < b1; y++) {
				const begin = (y * dim.width) + l;
				dests.push(...this.grid.slice(begin, begin+sliceLength));
			}
			if (wrapX) { dests.length -= r+1 }
			if (wrapY) {
				for (let y = 0; y < b; y++) {
					const begin = (y * dim.width) + l;
					dests.push(...this.grid.slice(begin, begin+sliceLength));
				}
				if (wrapX) { dests.length -= r+1 }
			}
			// TODO.impl use a set when radius > 2 to prevent duplicate entries?
			return dests.map((tile) => Object.assign({}, tile));
		}
		public _getTileSourcesTo(coord: Coord, radius: number = 1): Array<Tile> {
			return this._getTileDestsFrom(coord, radius);
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
	Grid.prototype._getTileSourcesTo = Grid.prototype._getTileDestsFrom;
	JsUtils.protoNoEnum(Grid, "_getTileAt", "_getTileDestsFrom", "_getTileSourcesTo");
	Object.freeze(Grid);
	Object.freeze(Grid.prototype);
}
Object.freeze(WrappedEuclid2);