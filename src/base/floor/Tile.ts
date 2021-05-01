
/**
 * A unique identifier within a Chunk.
 *
 * Implementations are free to decide how to allocate these values to
 * tak advantage of their spatial properties. They are also free to
 * define their own _internal_ augmented views of coordinates with
 * converters and operators.
 */
export type Coord = number;
export namespace Coord {
	/** */
	export const enum System {
		W_EUCLID2 = "Euclid2",
		BEEHIVE = "Beehive",
	}
}
Object.freeze(Coord);


/**
 * A DTO 📦
 *
 * None of the fields can be `undefined`. This simplifies detection
 * of "nullifying" fields vs leaving fields unchanged when processing
 * state change descriptors.
 *
 * @see Tile.ImplementationNotes
 */
export interface Tile {
	readonly coord: Coord;
	readonly seq: string;
}
export namespace Tile {
	/** A DTO of changes 📦 */
	export interface Changes {
		readonly char?: string;
		readonly seq:   string;
	}

	/**
	 * Implementations may design their internals in any way they wish.
	 *
	 * - They may store tiles as separate arrays for each Tile field.
	 * - They may use compile-time Tile immutability and freeze their Tile array.
	 *   - Then they must copy on read during development.
	 *   - They may seal the Tile objects after construction.
	 * - They may use at-runtime Tile immutability with a sealed Tile array.
	 *   - Then they must copy and freeze on write.
	 *   - In this case, do not expose shallow copies to external code.
	 *     - Ex. Grid.forEachShuffled callback argument.
	 */
	type _ImplementationNotes = undefined;
}