import { JsUtils } from "defs/JsUtils";
import type { Coord } from "floor/Tile";
import type { Player } from "./Player";


/**
 *
 */
export class Team<S extends Coord.System> {

    public readonly id: Team.Id;

    public readonly members: TU.RoArr<Player<S>>;

    #elimOrder: number;

    public constructor(teamId: Team.Id, members: TU.RoArr<Player<S>>) {
        if (members.length === 0) {
            throw new Error("Teams must have at least one member.");
        }
        this.id = teamId;
        this.members = members; // If paranoid, do a shallow copy.
        this.#elimOrder
            = (this.members.every((member) => member.status.noCheckGameOver))
            ? Team.ElimOrder.IMMORTAL
            : Team.ElimOrder.STANDING;

        JsUtils.propNoWrite(this as Team<S>, ["id", "members",]);
    }

    public reset(): void {
        if (this.elimOrder !== Team.ElimOrder.IMMORTAL) {
            this.elimOrder = Team.ElimOrder.STANDING;
        }
    }

    /**
     * @returns
     * Indicates the order (relative to other teams) in which this
     * team was to have all its members downed at the same time at
     * least once. Once a team is soft-eliminated, they can continue
     * playing as normal, but there is no going back. The game ends
     * when all teams but one have been soft-eliminated.
     *
     * ### Semantics
     *
     * A comparatively smaller value denotes having been soft-
     * eliminated at an earlier point in the game. **The value zero
     * denotes _not-having-been-soft-eliminated-yet_**.
     */
    public get elimOrder(): number {
        return this.#elimOrder;
    }
    public set elimOrder(teamElimOrder: number) {
        if (this.elimOrder === Team.ElimOrder.IMMORTAL) {
            throw new TypeError("Cannot change the elimination status of an immortal team.");
        }
        this.#elimOrder = teamElimOrder;
    }

}
export namespace Team {

    export type Id = number;

    export type ElimOrder = number;

    // Special values:
    export namespace ElimOrder {
        /**
         * A team starts off with such a value if all its players have
         * specified that their downing should not cause a check for
         * whether the game should end.
         */
        export const IMMORTAL = -1;

        /**
         * A team that is not invincible starts off with such a value.
         */
        export const STANDING = 0;
    }
}
Object.freeze(Team);
Object.freeze(Team.prototype);