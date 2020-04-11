import type { Coord } from "floor/Tile";
import type { Player } from "./Player";


/**
 * This abstracts acts of modification upon a player's state, allowing
 * extension classes to override setters to perform additional tasks
 * such as visually rendering updates to this state information in a
 * web browser, and playing sound effects.
 */
export class PlayerStatus<S extends Coord.System> {

    protected readonly player: Player<S>; // Circular field reference.
    #score:  Player.Health;
    #health: Player.Health;

    public constructor(player: Player<S>) {
        this.player = player;
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
        this.#health = newHealth;
        const team = this.player.team;
        if (this.isDowned && team.softEliminationOrder === 0) {
            // Right before this downing event, the team has not been
            // soft-eliminated yet, but it might be now. Check it:
            if (team.members.every((player) => player.status.isDowned)) {
                // All players are downed! The team is now soft-eliminated:
                const numSoftEliminatedTeams
                = team.softEliminationOrder = 1 + this.player.game.teams
                .filter((team) => team.softEliminationOrder > 0).length;
                // Now that a team is newly-soft-eliminated, check if the
                // game should end:
                // TODO.design This will not work if there are artificial-only teams
                // that do not try to eliminate each other! What to do... :/
                // See :/TODO.md for my thoughts on changes that could effect this.
                if (numSoftEliminatedTeams >= this.player.game.teams.length) {
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
Object.freeze(PlayerStatus.prototype);
