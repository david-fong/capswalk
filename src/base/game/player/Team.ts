import { JsUtils } from "defs/JsUtils";
import type { Player } from "./Player";

/**
 * @final
 */
export class Team {

	/**
	 * @returns
	 * Indicates the order (relative to other teams) in which this
	 * team was to have all its members downed at the same time at
	 * least once. Once a team is soft-eliminated, they can continue
	 * playing as normal, but there is no going back. The game ends
	 * when all teams but one have been eliminated.
	 *
	 * ### Semantics
	 *
	 * A comparatively smaller value denotes having been
	 * eliminated at an earlier point in the game. **The value zero
	 * denotes _not-having-been-eliminated-yet_**.
	 */
	public elimOrder: number;

	public constructor(
		public readonly id: Team.Id,
		public readonly members: TU.RoArr<Player>,
	) {
		JsUtils.propNoWrite(this as Team, "id", "members");
		Object.seal(this);
		if (members.length === 0) {
			throw new Error("Teams must have at least one member.");
		}
		this.elimOrder = Team.ElimOrder.STANDING;

	}

	public reset(): void {
		this.elimOrder = Team.ElimOrder.STANDING;
	}
}
export namespace Team {

	export type Id = number;

	export type ElimOrder = number;

	// Special values:
	export namespace ElimOrder {
		/**
		 * A team that is not invincible starts off with such a value.
		 */
		export const STANDING = 0;
	}
}
Object.freeze(Team);
Object.freeze(Team.prototype);