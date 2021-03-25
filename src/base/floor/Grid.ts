import { JsUtils } from "defs/JsUtils";
import type { Coord, Tile } from "./Tile";
import { Player } from "defs/TypeDefs";

import type { WrappedEuclid2 } from "./impl/Euclid2/System";
import type { Beehive } from "./impl/Beehive/System";

/**
 * A Collection of Tiles.
 */
export abstract class Grid<S extends Coord.System> {

	// A type-annotated alias to this.constructor.
	public readonly static: Grid.ClassIf<S>;

	public readonly dimensions: Grid.Dimensions[S];

	public readonly area: number;

	/**
	 * Protected. See `Grid.getImplementation` for how to access class
	 * literals for construction.
	 */
	protected constructor(desc: Grid.CtorArgs<S>) {
		Object.freeze(desc);
		this.static = desc.Grid;
		this.dimensions = desc.dimensions;
		this.area = desc.Grid.getArea(desc.dimensions);
		JsUtils.propNoWrite(this as Grid<S>, "static", "dimensions");
	}

	/** @virtual */
	public reset(): void {
		this.forEach((tile) => {
			this.write(tile.coord, {
				occId: Player.Id.NULL,
				char: "", seq: "", health: 0,
			});
		});
	}

	/** */
	public abstract write(coord: Coord, changes: Readonly<Tile.Changes>): void;

	/**
	 * For BaseGame's implementation of SER/DES to work, the traversal
	 * order taken by an implementation of this method must depend
	 * only on the dimensions of the instance. The index is not required
	 * to equal the tile's coord.
	 */
	public abstract forEach(callback: (tile: Tile, index: number) => void): void;

	public abstract forEachShuffled(callback: (tile: Tile, index: number) => void): void;

	/**
	 * @returns
	 * One of the closest unoccupied neighbouring tiles toward the
	 * direction of `intendedDest`. When possible, ties are encouraged
	 * to be broken in such a way that imitates movement in a straight
	 * path (visually speaking).
	 *
	 * **Important:** If All destinations from sourceCoord are occupied
	 * (which includes `sourceCoord` itself), the implementation must
	 * return `sourceCoord`.
	 *
	 * @param intendedDest
	 *
	 * @param sourceCoord
	 * The coordinate from which to find the next hop.
	 */
	public abstract getUntToward(intendedDest: Coord, sourceCoord: Coord): Tile;

	/**
	 * The opposite of `getUntToward`.
	 *
	 * Behaviour is undefined when both arguments are the same.
	 */
	public abstract getUntAwayFrom(avoidCoord: Coord, sourceCoord: Coord): Tile;

	/**
	 * The returned array should be assumed to contain shallow copies
	 * of the corresponding Tile objects.
	 *
	 * This action is commonly performed by the GameManager when
	 * shuffling in new CSP's to its grid.
	 *
	 * Implementations with wrapping edges must make sure that the
	 * return value does not contain duplicate tile entries.
	 *
	 * @virtual
	 * Grid implementations are encouraged to override this if they
	 * have a more efficient way to produce the same result.
	 */
	public getAllAltDestsThan(originCoord: Coord): ReadonlyArray<Tile> {
		return Array.from(new Set(
			this.tileSourcesTo(originCoord)
				.flatMap((sourceToTarget) => this.tileDestsFrom(sourceToTarget.coord))
		));
	}

	public getRandomCoord(): Coord {
		return this.static.getRandomCoord(this.dimensions);
	}

	/**
	 * A coord that is at most `radius` movements away from `origin`.
	 * The returned value does not necessarily need to be within this
	 * grid's dimensions as long as the returned coordinate can be
	 * meaningfully truncated by `getUntToward` when passing `origin`
	 * as the `sourceCoord` argument.
	 *
	 * The returned value should follow a uniform distribution.
	 */
	public abstract getRandomCoordAround(origin: Coord, radius: number): Coord;

	/** Treat the result as a state snapshot. */
	public abstract tileAt(coord: Coord): Tile;
	/** Treat the result as a state snapshot. */
	public abstract tileDestsFrom(coord: Coord): ReadonlyArray<Tile>;
	/** Treat the result as a state snapshot. */
	public abstract tileSourcesTo(coord: Coord): ReadonlyArray<Tile>;

	/**
	 * The returned value must be consistent with results from the
	 * methods `_getTileDestsFrom` and `_getTileSourcesTo`.
	 */
	public abstract dist(source: Coord, dest: Coord): number;

	/**
	 * @virtual
	 * Implementations are free to override this to spawn players in
	 * pretty patterns.
	 */
	public static getSpawnCoords(
		teamSizes: ReadonlyArray<number>,
		dimensions: Grid.Dimensions[Coord.System],
	): ReadonlyArray<ReadonlyArray<Coord>> {
		const avoidSet = new Set<Coord>();
		return teamSizes.map((numMembers: number) => {
			const teamSpawnCoords: Array<Coord> = [];
			while (numMembers > 0) {
				let coord: Coord;
				do {
					coord = (this as unknown as Grid.ClassIf<any>).getRandomCoord(dimensions);
				} while (avoidSet.has(coord));
				teamSpawnCoords.push(coord);
				avoidSet.add(coord);
				numMembers--;
			}
			return teamSpawnCoords.freeze();
		}).freeze();
	}
}
export namespace Grid {

	/** */
	export interface Dimensions {
		[Coord.System.W_EUCLID2]: WrappedEuclid2.Grid.Dimensions;
		[Coord.System.BEEHIVE]: Beehive.Grid.Dimensions;
	};

	// ==============================================================
	// Note: The below exports do not require any modifications with
	// the additions of new coordinate systems.
	// ==============================================================

	export type CtorArgs<S extends Coord.System> = Readonly<{
		Grid: Grid.ClassIf<S>;
		system: S;
		dimensions: Dimensions[S];
		players: any; // TODO.design
	}>;

	/** Used to simulate abstract static methods. */
	export interface ClassIf<S extends Coord.System> {

		/** Constructor */
		new(desc: CtorArgs<S>): Grid<S>;

		/**
		 * @returns
		 * The minimum number of leaf nodes a language must have to be
		 * playable with this coordinate system's grid.
		 *
		 * Definition: The maximum possible number- for any tile in the
		 * grid- of all destinations from sources to itself, excluding
		 * itself.
		 */
		ambiguityThreshold: number;

		/** @see Grid.DimensionBounds */
		sizeLimits: Grid.DimensionBounds<S>;

		/**
		 * @returns
		 * The number of Tiles that could fit in a Grid of such bounds.
		 */
		getArea(bounds: Dimensions[S]): number;

		/**
		 * \*Assuming the grid is lattice-like and is partitioned into
		 * highly similar patches where each patch has a center, and
		 * all tiles in the patch are closer to that center tile than
		 * to any other patch's center tile. Returns the minimum number
		 * of tiles that must be visited to get from the center of one
		 * patch to any neighbouring patch.
		 */
		getLatticePatchDiameter(area: number): number;

		/**
		 * @returns
		 * A coordinate with random, integer-valued fields within the
		 * specified upper limits
		 */
		getRandomCoord(bounds: Dimensions[S]): Coord;

		/**
		 * Return values do not need to be the same for repeated calls
		 * with identical arguments. None of the returned coordinates
		 * should be the same.
		 */
		getSpawnCoords(
			teamSizes: readonly number[],
			dimensions: Dimensions[S],
		): readonly (readonly Coord[])[];
	};

	// Each implementation must register itself into this dictionary.
	// See CmapManager.ts.
	export const _Constructors: {
		readonly [ S in Coord.System ]: Grid.ClassIf<S>
	} = {
		// These are initialized later to avoid bootstrapping issues.
		["W_EUCLID2"]: undefined!,
		["BEEHIVE"]: undefined!,
	};

	/**
	 * @returns
	 * A Grid class for the specified coordinate system.
	 */
	export const getImplementation = <S extends Coord.System>(coordSys: S): ClassIf<S> => {
		// Note: At the time of writing this, separating this into
		// two lines is necessary (otherwise Typescript will feel
		// overwhelmed)
		const ctor = _Constructors[coordSys];
		return ctor as unknown as ClassIf<S>;
	};

	/**
	 * Bounds are inclusive. Ie. the specified values are _just_ allowed.
	 *
	 * Upper and lower bounds must be strictly positive integer values.
	 */
	export type DimensionBounds<S extends Coord.System> = Readonly<{
		[P in keyof Dimensions[S]]: {
			readonly min: number;
			readonly max: number;
		};
	}>;
}
// Grid gets frozen in PostInit after _Constructors get initialized.
Object.freeze(Grid);
Object.freeze(Grid.prototype);