import type { Coord } from "floor/Tile";
import type { Player } from "./Player";
import { Team } from "game/player/Team";


/**
 * This abstracts acts of modification upon a player's state, allowing
 * extension classes to override setters to perform additional tasks
 * such as visually rendering updates to this state information in a
 * web browser, and playing sound effects.
 */
export class PlayerStatus<S extends Coord.System> {

    protected readonly player: Player<S>; // Circular field reference.
    public readonly noCheckGameOver: boolean;
    #score:  Player.Health;
    #health: Player.Health;

    public readonly baseElem?: HTMLDivElement;

    public constructor(player: Player<S>, noCheckGameOver: boolean) {
        this.player = player;
        this.noCheckGameOver = noCheckGameOver;
    }

    public reset(): void {
        this.score   = 0;
        this.health  = 0;
    }


    public get score(): Player.Health {
        return this.#score;
    }
    public set score(newValue: Player.Health) {
        this.#score = newValue;
    }

    public get health(): Player.Health {
        return this.#health;
    }
    public set health(newHealth: Player.Health) {
        const oldIsDowned = this.isDowned;
        this.#health = newHealth;

        if (oldIsDowned) return;
        const team  = this.player.team;
        const teams = this.player.game.teams;
        if (this.isDowned && !(this.noCheckGameOver) && team.elimOrder === 0) {
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
    // TODO.design Equation and architecture for getting/setting adjusted health.
    // This should be a getter here. Easy now that I added the circular reference to the Player.

    public get isDowned(): boolean {
        return this.health < 0.0;
    }
}
Object.freeze(PlayerStatus);
Object.freeze(PlayerStatus.prototype);
