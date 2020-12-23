import type { Coord, Tile } from "floor/Tile";
import type { Player } from "game/player/Player";

/**
 */
export namespace StateChange {
	/**
	 * This is the agreed upon value that both the server and client
	 * copies of a game should set as the initial value for request id
	 * counters. Remember that a request ID is a property of a player,
	 * whereas an event ID is a property tied to a game.
	 */
	export const INITIAL_PLAYER_REQUEST_ID = 0;

	export interface _Base {
		readonly initiator: Player.Id;
	}

	/**
	 * An immutable Request DTO 📦
	 */
	export interface Req extends _Base {
		readonly moveType: Player.MoveType;
		readonly moveDest: Coord;
	}

	/**
	 * An immutable Response DTO 📦
	 */
	export type Res = Res.Accepted | Res.Rejected;
	export namespace Res {

		export interface Accepted extends _Base {
			readonly rejected?: undefined;

			/**
			 * Tiles other than the tile that the initiating player is moving to.
			 *
			 * Occupant changes are communicated in the `players` field- not here.
			 */
			readonly tiles: Record<Coord, Tile.Changes>;

			/**
			 */
			readonly players: Readonly<Record<Player.Id, {
				coord: Coord,
				health: Player.Health,
			}>>;
		}
		export interface Rejected extends _Base {
			readonly rejected: true;
		}
	}
}
Object.freeze(StateChange);