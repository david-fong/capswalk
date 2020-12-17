
/**
 * A unique identifier within a Chunk.
 *
 * Implementations are free to decide how to allocate these values to
 * tak advantage of their spatial properties. They are also free to
 * define their own _internal_ augmented views of coordinates with
 * converters and operators.
 */
export type Coord = number;

/**
 */
export namespace Coord {

	export const enum System {
		W_EUCLID2 = "W_EUCLID2",
		BEEHIVE = "BEEHIVE",
	}
}
Object.freeze(Coord);