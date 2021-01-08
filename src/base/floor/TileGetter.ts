import type { Coord, Tile } from "./Tile";
import { Player } from "defs/TypeDefs";


type _Arguments = [ Coord, ] | [];

/**
 * A utility class to get destinations-to or sources-from a tile at
 * a specified coordinate. It is recommended to name the calling
 * variable "tile". A query starts with calling one of the methods
 * `at`, `destsFrom`, or `sourcesTo`. Optional filtering mutators
 * can be applied intermediately such as `unoccupied`. The query
 * ends with one of the getters `occupants` or `get`.
 *
 * @template A
 * This allows `Source` implementations to accept a coordinate
 * specifier as an argument, such as is appropriate with a grid,
 * or to provide that information implicitly inside itself as
 * part of its spec, as is appropriate with a player.
 */
export class TileGetter<A extends _Arguments> {

	readonly #source: TileGetter.Source<A>;
	public get _source(): TileGetter.Source<A> {
		return this.#source;
	}

	public constructor(source: TileGetter.Source<A>) {
		this.#source = source;
		Object.freeze(this);
	}

	public at(...args: A): Tile {
		return this.#source.tileAt(...args);
	}
	public destsFrom(...args: A): Query {
		return new Query(this.#source.tileDestsFrom(...args));
	}
	public sourcesTo(...args: A): Query {
		return new Query(this.#source.tileSourcesTo(...args));
	}
}
export namespace TileGetter {
	/**
	 * A Tile should always be a source-to and destination-from itself.
	 */
	export interface Source<A extends _Arguments = [Coord]> {
		tileAt(...args: A): Tile;
		// NOTE: do we need to add an optional argument for range?
		// If so, document that it must default to `1` if unspecified.
		tileDestsFrom(...args: A): TU.RoArr<Tile>;
		tileSourcesTo(...args: A): TU.RoArr<Tile>;
	}
}
Object.freeze(TileGetter);
Object.freeze(TileGetter.prototype);


/**
 *
 */
class Query {

	public constructor(protected contents: TU.RoArr<Tile>) {
		Object.seal(this); //🧊
	}

	public get occupied(): Omit<Query, "unoccupied"> {
		this.contents = this.contents.filter((tile) => tile.occId !== Player.Id.NULL);
		return this;
	}

	public get unoccupied(): Omit<Query, "occupied"> {
		this.contents = this.contents.filter((tile) => tile.occId === Player.Id.NULL);
		return this;
	}

	public get get(): TU.RoArr<Tile> {
		return Object.freeze(this.contents);
	}
}
Object.freeze(Query);
Object.freeze(Query.prototype);