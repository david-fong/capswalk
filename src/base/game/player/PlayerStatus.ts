import { JsUtils } from "defs/JsUtils";
import type { Coord, Tile } from "floor/Tile";
import type { Player } from "./Player";
import { Team } from "game/player/Team";


/**
 * This abstracts acts of modification upon a player's state, allowing
 * extension classes to override setters to perform additional tasks
 * such as visually rendering updates to this state information in a
 * web browser, and playing sound effects.
 */
export class PlayerStatus<S extends Coord.System> {

	protected readonly player: Readonly<Player<S>>; // Circular field reference.
	public readonly noCheckGameOver: boolean;
	#health: Player.Health;

	public constructor(player: Readonly<Player<S>>, noCheckGameOver: boolean) {
		this.player = player;
		this.noCheckGameOver = noCheckGameOver;
		JsUtils.instNoEnum(this as PlayerStatus<S>, ["player"]);
	}

	public reset(): void {
		this.health = 0;
	}

	public _afterAllPlayersConstruction(): void { }

	public get immigrantInfo(): Tile.VisibleImmigrantInfo | undefined {
		return undefined;
	}


	public get health(): Player.Health {
		return this.#health;
	}
	public set health(newHealth: Player.Health) {
		const oldIsDowned = this.isDowned;
		this.#health = newHealth;

		if (oldIsDowned || !this.isDowned || this.noCheckGameOver) return;
		const team  = this.player.team;
		const teams = this.player.game.teams;
		if (team.elimOrder === Team.ElimOrder.STANDING) {
			// Right before this downing event, the team has not been
			// soft-eliminated yet, but it might be now. Check it:
			if (team.members.every((player) => {
				return player.status.noCheckGameOver || player.status.isDowned;
			})) {
				// All players are downed! The team is now eliminated:
				const numNonStandingTeams
					= 1 + teams.filter((team) => {
					return team.elimOrder !== Team.ElimOrder.STANDING;
				}).length;
				team.elimOrder
					= 1 + teams.filter((team) => {
					return team.elimOrder !== Team.ElimOrder.STANDING
						&& team.elimOrder !== Team.ElimOrder.IMMORTAL;
				}).length;
				// Now that a team is newly-eliminated, check if the
				// game should end:
				if (numNonStandingTeams === teams.length) {
					this.player.game.statusBecomeOver();
				}
			}
		}
	}

	public get isDowned(): boolean {
		return this.health < 0.0;
	}
}
JsUtils.protoNoEnum(PlayerStatus, ["_afterAllPlayersConstruction"]);
Object.freeze(PlayerStatus);
Object.freeze(PlayerStatus.prototype);