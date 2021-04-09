import { JsUtils } from "defs/JsUtils";
import type { Coord as BaseCoord, Coord, Tile } from "floor/Tile";
import type { Player } from "defs/TypeDefs";
import { Grid as AbstractGrid } from "floor/Grid";
type S = BaseCoord.System.W_EUCLID2;

export type Dim = {
	readonly height: number,
	readonly width:  number,
};

/**
 * Euclid2 Internal Augmented Coord
 *
 * Immutable.
 */
class IAC {
	public constructor(
		public readonly x: number,
		public readonly y: number,
	) {
		Object.freeze(this);
	}
	public static from(dimensions: Dim, coord: Coord): IAC {
		return new IAC(coord % dimensions.width, Math.floor(coord / dimensions.width));
	}
	public toCoord(dimensions: Dim): Coord {
		return (this.y * dimensions.width) + this.x;
	}

	public static distX(dim: Dim, i1: IAC.Bare, i2: IAC.Bare): number {
		let dx = Math.abs(i1.x - i2.x);
		return (dx < dim.width / 2) ? dx : (dim.width - dx);
	}
	public static distY(dim: Dim, i1: IAC.Bare, i2: IAC.Bare): number {
		let dy = Math.abs(i1.y - i2.y);
		return (dy < dim.height / 2) ? dy : (dim.height - dy);
	}
	public static oneNorm(dim: Dim, i1: IAC.Bare, i2: IAC.Bare): number {
		const dx = IAC.distX(dim,i1,i2), dy = IAC.distY(dim,i1,i2);
		return dx + dy;
	}
	public static infNorm(dim: Dim, i1: IAC.Bare, i2: IAC.Bare): number {
		const dx = IAC.distX(dim,i1,i2), dy = IAC.distY(dim,i1,i2);
		return Math.max(dx, dy);
	}
	/** Returns wrapping information as signums. */
	public static wrap(dim: Dim, from: IAC.Bare, to: IAC.Bare): IAC.Bare {
		return Object.freeze({
			x: (Math.abs(to.x - from.x) < dim.width  / 2) ? 0 : (to.x < from.x) ? -1 : 1,
			y: (Math.abs(to.y - from.y) < dim.height / 2) ? 0 : (to.y < from.y) ? -1 : 1,
		});
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
	public static axialAlignment(dim: Dim, _i1: Coord, _i2: Coord): number {
		const i1 = IAC.from(dim, _i1), i2 = IAC.from(dim, _i2);
		const dx = IAC.distX(dim,i1,i2), dy = IAC.distY(dim,i1,i2);
		return (Math.abs(dx - dy)) / (dx + dy);
	}

	public add(other: IAC.Bare): IAC {
		return new IAC(
			this.x + other.x,
			this.y + other.y,
		);
	}
	public sub(other: IAC.Bare): IAC {
		return new IAC(
			this.x - other.x,
			this.y - other.y,
		);
	}
	public iSub(other: IAC.Bare): IAC {
		return this.add(this.sub(other));
	}
	public mul(scalar: number): IAC {
		return new IAC(
			scalar * this.x,
			scalar * this.y,
		);
	}
	public mod(dim: Dim): IAC {
		let {x,y} = this;
		while (x < 0) x += dim.width;
		while (y < 0) y += dim.height;
		x %= dim.width;
		y %= dim.height;
		return new IAC(x,y);
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
 * Edges are wrapped.
 */
export namespace WrappedEuclid2 {

	/**
	 * Euclid2 Grid
	 */
	export class Grid extends AbstractGrid<S> {

		public static ambiguityThreshold = 24;

		public static sizeLimits: AbstractGrid.DimensionBounds<S> = JsUtils.deepFreeze({
			height: { min: 5, max: 51 },
			width:  { min: 5, max: 51 },
		});

		private readonly _grid: SealedArray<Tile>;
		readonly #occ: Uint8Array;

		protected readonly iacCache: readonly IAC[];

		public constructor(desc: AbstractGrid.CtorArgs<S>) {
			super(desc);

			this.#occ = new Uint8Array(this.area);
			const grid: Tile[] = [];
			for (let y = 0; y < this.dimensions.height; y++) {
				for (let x = 0; x < this.dimensions.width; x++) {
					grid.push({ coord: (y * this.dimensions.width) + x, seq: "" });
				}
			}
			this._grid = grid.seal();

			const iacCache = [];
			for (let y = 0; y < desc.dimensions.height; y++) {
				for (let x = 0; x < desc.dimensions.width; x++) {
					iacCache.push(new IAC(x,y));
				}
			}
			this.iacCache = iacCache.freeze();
			JsUtils.instNoEnum(this as Grid, "iacCache");
			JsUtils.propNoWrite(this as Grid, "_grid", "iacCache");
			if (new.target === Grid) {
				Object.seal(this); //🧊
			}
		}

		public reset(): void {
			super.reset();
			this.#occ.fill(0);
		}

		public write(coord: Coord, changes: Tile.Changes): void {
			this._grid[coord] = Object.freeze(Object.assign(
				{}, this._grid[coord], changes,
			));
		}

		public moveEntity(entityId: Player.Id, from: Coord, to: Coord): void {
			this.#occ[from] = 0;
			this.#occ[to] = 1;
		}

		public forEach(consumer: (tile: Tile, index: number) => void): void {
			for (let i = 0; i < this.area; i++) {
				consumer(this._grid[i]!, i);
			}
		}
		public forEachShuffled(consumer: (tile: Tile, index: number) => void): void {
			const indices = new Uint16Array(this.area);
			for (let i = 0; i < this.area; i++) {
				indices[i] = i;
			}
			indices.sort(() => Math.random() - 0.5);
			for (const index of indices) {
				consumer(this._grid[index]!, index);
			}
		}

		public getUntToward(intendedDest: Coord, sourceCoord: Coord): Tile {
			const options = this.tileDestsFrom(sourceCoord)
			.filter((tile) => !this.isOccupied(tile.coord))
			.map((tile) => {
				const tileIac = this.iacCache[tile.coord]!;
				const destIac = this.iacCache[intendedDest]!;
				return {
					tile, iac: tileIac,
					infNorm: IAC.infNorm(this.dimensions, tileIac, destIac),
					oneNorm: IAC.oneNorm(this.dimensions, tileIac, destIac),
				};
			});
			if (options.length === 0) {
				return this.tileAt(sourceCoord);
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
					// The path is aligned more with the x or y axis than
					// it is with those axes rotated 45 degrees.
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
			const avoid = this.iacCache[_avoidCoord]!;
			const src = this.iacCache[_sourceCoord]!;
			const dest = src.iSub(avoid).mod(this.dimensions);
			return this._grid[dest.toCoord(this.dimensions)]!;
		}

		public getAllAltDestsThan(originCoord: Coord): readonly Tile[] {
			return this.tileDestsFrom(originCoord, 2);
		}

		public getRandomCoordAround(_origin: Coord, radius: number): Coord {
			const origin = this.iacCache[_origin]!;
			return new IAC(
				origin.x + Math.trunc(2 * radius * (Math.random() - 0.5)),
				origin.y + Math.trunc(2 * radius * (Math.random() - 0.5)),
			).mod(this.dimensions).toCoord(this.dimensions);
		}

		public dist(source: Coord, dest: Coord): number {
			return IAC.infNorm(this.dimensions,
				this.iacCache[source]!,
				this.iacCache[dest]!,
			);
		}

		public isOccupied(coord: Coord): boolean {
			return this.#occ[coord]! !== 0;
		}
		public tileAt(coord: Coord): Tile {
			return this._grid[coord]!;
		}
		public tileDestsFrom(coord: Coord, radius: number = 1): readonly Tile[] {
			const iac = this.iacCache[coord]!;
			let wrapX = false, wrapY = false;
			const W = this.dimensions.width, H = this.dimensions.height;
			let t = (iac.y - radius);    if (t < 0) { t += H; wrapY = true; }
			let l = (iac.x - radius);    if (l < 0) { l += W; wrapX = true; }
			let b = (iac.y + radius +1); if (b > H) { b -= H; wrapY = true; }
			let r = (iac.x + radius +1); if (r > W) { r -= W; wrapX = true; }
			// ^Adjusted so that t and l can be treated as non-wrapped.
			const dests: Array<Tile> = [];
			if (wrapX) {
				dests.push(...this._grid.slice(0, r).freeze());
				if (wrapY) {
					const _t = t * W;
					dests.push(...this._grid.slice(_t, _t+r).freeze());
				}
			}

			const b1 = wrapY ? H : b;
			const sliceLength = (radius * 2) + 1;
			for (let y = t; y < b1; y++) {
				const begin = (y * W) + l;
				dests.push(...this._grid.slice(begin, begin+sliceLength).freeze());
			}
			if (wrapX && !wrapY && (b !== H)) { dests.length -= r; }
			if (wrapY) {
				for (let y = 0; y < b; y++) {
					const begin = (y * W) + l;
					dests.push(...this._grid.slice(begin, begin+sliceLength).freeze());
				}
				if (wrapX) { dests.length -= r; }
			}
			// TODO.impl use a set when radius > 2 to prevent duplicate entries?
			return dests.freeze();
		}
		public tileSourcesTo(coord: Coord, radius: number = 1): readonly Tile[] {
			return this.tileDestsFrom(coord, radius);
		}

		declare public static getSpawnCoords: AbstractGrid.ClassIf<S>["getSpawnCoords"];

		public static getArea(dim: Grid.Dimensions): number {
			return dim.height * dim.width;
		}

		public static getLatticePatchDiameter(area: number): number {
			return Math.sqrt(area);
		}

		public static getRandomCoord(dimensions: Grid.Dimensions): Coord {
			const x = Math.floor(dimensions.width  * Math.random());
			const y = Math.floor(dimensions.height * Math.random());
			return (y * dimensions.width) + x;
		}

		/** @internal */
		public _assertSomeInvariants(): void {
			const bad = this._grid.map((t,i) => {
				const arr = this.getAllAltDestsThan(t.coord).map(t => t.coord).sort().freeze();
				return { i, arr };
			}).filter(o => o.arr.length !== 25).freeze();
			if (bad.length) {
				console.error(bad);
				throw new Error("never");
			}
		}
	}
	export namespace Grid {
		/**
		 * If `width` is not specified, `height` is taken as its default value.
		 */
		export type Dimensions = Dim;
	}
	Grid.prototype.tileSourcesTo = Grid.prototype.tileDestsFrom;
	JsUtils.protoNoEnum(Grid, "tileAt", "tileDestsFrom", "tileSourcesTo");
	Object.freeze(Grid);
	Object.freeze(Grid.prototype);
}
Object.freeze(WrappedEuclid2);