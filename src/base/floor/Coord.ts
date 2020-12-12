
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
		EUCLID2 = "EUCLID2",
		BEEHIVE = "BEEHIVE",
	}
}
Object.freeze(Coord);