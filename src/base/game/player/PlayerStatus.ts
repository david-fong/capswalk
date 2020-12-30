import { JsUtils } from "defs/JsUtils";
import type { Player } from "./Player";
import type { GameMirror } from "game/gameparts/GameMirror";
import { Team } from "./Team";

/**
 * This abstracts acts of modification upon a player's state, allowing
 * extension classes to override setters to perform additional tasks
 * such as visually rendering updates to this state information in a
 * web browser, and playing sound effects.
 */
export class PlayerStatus {

	#health: Player.Health;

	public constructor(
		protected readonly player: Readonly<Player>, // Circular field reference.
		protected readonly game: GameMirror<any,any>, // Circular field reference.
	) {
		JsUtils.instNoEnum(this as PlayerStatus, "player", "game");
	}

	public reset(): void {
		this.health = 0;
	}

	public get health(): Player.Health {
		return this.#health;
	}
	public set health(newHealth: Player.Health) {
		const oldIsDowned = this.isDowned;
		this.#health = newHealth;

		if (oldIsDowned || !this.isDowned) return;
		const team  = this.player.team;
		const teams = this.game.teams;
		if (team.elimOrder !== Team.ElimOrder.STANDING) {
			return;
		}
		// Right before this downing event, the team has not been
		// soft-eliminated yet, but it might be now. Check it:
		if (team.members.every((player) => player.status.isDowned)) {
			// All players are downed! The team is now eliminated:
			const numNonStandingTeams
				= 1 + teams.filter((team) => {
				return team.elimOrder !== Team.ElimOrder.STANDING;
			}).length;

			team.elimOrder = 1 + teams.filter((team) => {
				return team.elimOrder !== Team.ElimOrder.STANDING;
			}).length;
			// Now that a team is newly-eliminated, check if the
			// game should end:
			if (numNonStandingTeams === teams.length) {
				this.game.statusBecomeOver();
			}
		}
	}

	public get isDowned(): boolean {
		return this.health < 0.0;
	}
}
Object.freeze(PlayerStatus);
Object.freeze(PlayerStatus.prototype);