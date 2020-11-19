import type { Coord, Tile } from "./Tile";


type CoordSys = Coord.System;

type Arguments<S extends CoordSys> = [ Coord.Bare[S], ] | [];

/**
 * A utility class to get destinations-to or sources-from a tile at
 * a specified coordinate. It is recommended to name the calling
 * variable "tile". A query starts with calling one of the methods
 * `at`, `destsFrom`, or `sourcesTo`. Optional filtering mutators
 * can be applied intermediately such as `unoccupied`. The query
 * ends with one of the getters `occupants` or `get`.
 *
 * @template S
 *
 * @template A
 * This allows `Source` implementations to accept a coordinate
 * specifier as an argument, such as is appropriate with a grid,
 * or to provide that information implicitly inside itself as
 * part of its spec, as is appropriate with a player.
 *
 */
export class TileGetter<S extends CoordSys, A extends Arguments<S>> {

	readonly #source: TileGetter.Source<S,A>;
	public get _source(): TileGetter.Source<S,A> {
		return this.#source;
	}

	public constructor(source: TileGetter.Source<S,A>) {
		this.#source = source;
		Object.freeze(this);
	}

	public at(...args: A): Tile<S> {
		return this.#source._getTileAt(...args);
	}
	public destsFrom(...args: A): Query<S> {
		return new Query(this.#source._getTileDestsFrom(...args));
	}
	public sourcesTo(...args: A): Query<S> {
		return new Query(this.#source._getTileSourcesTo(...args));
	}
}
export namespace TileGetter {
	/**
	 * A Tile should always be a source-to and destination-from itself.
	 */
	export interface Source<S extends CoordSys, A extends Arguments<S> = [Coord.Bare[S]]> {
		_getTileAt(...args: A): Tile<S>;
		// NOTE: do we need to add an optional argument for range?
		// If so, document that it must default to `1` if unspecified.
		_getTileDestsFrom(...args: A): Array<Tile<S>>;
		_getTileSourcesTo(...args: A): Array<Tile<S>>;
	}
}
Object.freeze(TileGetter);
Object.freeze(TileGetter.prototype);


/**
 *
 */
class Query<S extends CoordSys> {

	public constructor(protected contents: Array<Tile<S>>) {
		Object.seal(this);
	}

	public get occupied(): Omit<Query<S>, "unoccupied"> {
		this.contents = this.contents.filter((tile) => tile.isOccupied);
		return this;
	}

	public get unoccupied(): Omit<Query<S>, "occupied"> {
		this.contents = this.contents.filter((tile) => !tile.isOccupied);
		return this;
	}

	public get get(): Array<Tile<S>> {
		const retval = this.contents;
		return retval;
	}
}
Object.freeze(Query);
Object.freeze(Query.prototype);