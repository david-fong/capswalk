import type { Lang, Player } from "defs/TypeDefs";
import type { Coord } from "./Coord"; export { Coord };

/**
 * A DTO 📦
 *
 * None of the fields can be `undefined`. This simplifies detection
 * of "nullifying" fields vs leaving fields unchanged when processing
 * state change descriptors.
 *
 * @see Tile.ImplementationNotes
 */
export interface Tile extends Required<Tile.Changes> {
	readonly coord: Coord;
}
export namespace Tile {
	/**
	 * A DTO of changes 📦
	 */
	export interface Changes {

		/**
		 * To evict an occupant, pass `Player.Id.NULL`.
		 */
		readonly occId?:  Player.Id;
		readonly health?: Player.Health;
		readonly char?:   Lang.Char;
		readonly seq?:    Lang.Seq;
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
	export type ImplementationNotes = undefined;
}