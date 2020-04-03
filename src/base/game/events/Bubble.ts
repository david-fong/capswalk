import type { Player } from "game/player/Player";
import { EventRecordEntry, PlayerGeneratedRequest } from "./EventRecordEntry";

/**
 * # The Object of the Game
 *
 * Be the last surviving team. Players attack members from opposing
 * teams by equally levelling down each others' (adjusted\*) health.
 * If all players on a team together have negative health at a single
 * point in time, they can no longer regain health, and their team is
 * no longer a candidate for the winning/surviving team, although they
 * can still continue playing as normal.
 *
 * Notice that attacking enemy team members removes "health-energy"
 * from the system, whereas the spawning of health adds it, and the
 * transferral of health between teammates results in no net change.
 *
 * \* A player's health will be adjusted to sympathize with teams
 * suffering from a headcount-disadvantage. For more information, see
 * {@link PlayerStatus.adjustedStockpile}.
 */
// TODO.design A way to make turtling unprofitable.
export namespace Bubble {



    /**
     *
     */
    export class MakeEvent implements PlayerGeneratedRequest {

        public static readonly EVENT_NAME = "bubble-make";

        public eventId: number = EventRecordEntry.EVENT_ID_REJECT;

        public readonly playerId: Player.Id;

        public playerLastAcceptedRequestId: number;

        public affectedNeighbours?: ReadonlyArray<{
            readonly playerId: Player.Id;
            readonly newRawHealth: Player.Health.Raw;
        }> = undefined;

        public constructor(
            playerId: Player.Id,
            lastAcceptedRequestId: number,
        ) {
            this.playerId = playerId;
            this.playerLastAcceptedRequestId = lastAcceptedRequestId;
        }

    }

}
