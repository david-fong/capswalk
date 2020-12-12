import type { Lang, Player } from "defs/TypeDefs";
import type { Coord } from "./Coord"; export { Coord };

/**
 * A DTO 📦
 */
export interface Tile {

	readonly coord: Coord;
	occId:  Player.Id | undefined;
	health: Player.Health;
	char:   Lang.Char;
	seq:    Lang.Seq;

	/**
	 * The number of times this `Tile` was occupied since the last
	 * reset.
	 *
	 * This is used to ensure that in online sessions, each
	 * client has a synchronized copy of the game. The Game Manager
	 * will drop requests for movements made by players who made the
	 * request at a time when they had not yet received information
	 * related to the game-state in affected-zones of their request.
	 */
	now: number;
}