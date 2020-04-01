import type { Player } from "game/player/Player";
import { EventRecordEntry, PlayerGeneratedRequest } from "./EventRecordEntry";

/**
 * # The Object of the Game
 *
 * Now that the game is multiplayer-capable, a lot of possibilities
 * have opened up because there is more for the player to interact
 * with.
 *
 * The object of the game is to be the last team to have all their
 * members downed at the same time. As long as there is one member in
 * a team that has not been taken down, other downed members can still
 * be raised. Downed members can still move and take actions to assist
 * their teammates take down opposing players.
 *
 * To prevent turtling, a periodic event occurs where all players get
 * their unadjusted health lowered by the same amount. An implementation
 * note, this should remove health-points from the game roughly equal
 * to (and maybe slightly less than) how much is added over time.
 *
 * A player's health will be adjusted to sympathize with teams
 * suffering from a headcount-disadvantage. For more information, see
 * {@link PlayerStatus.adjustedStockpile}.
 *
 */
export namespace Bubble {



    /**
     *
     */
    export class MakeEvent implements PlayerGeneratedRequest {

        public static readonly EVENT_NAME = "bubble-make";

        public eventId: number = EventRecordEntry.EVENT_ID_REJECT;

        public readonly playerId: Player.Id;

        public lastAcceptedRequestId: number;

        public constructor(
            playerId: Player.Id,
            lastAcceptedRequestId: number,
        ) {
            this.playerId = playerId;
            this.lastAcceptedRequestId = lastAcceptedRequestId;
        }

    }



    /**
     * This descriptor is only ever used to send event information from
     * the server to clients. Since this event is triggered by the Game
     * Manager (as a timed callback to a bubble-make request), there is
     * no exposed method to process a request.
     */
    export class PopEvent implements EventRecordEntry {

        public static readonly EVENT_NAME = "bubble-pop";

        // For this class, the request should never get rejected.
        public eventId: number;

        public bubblerId: Player.Id;

        public playersToDown: ReadonlyArray<Player.Id>;

        public playersToRaise: ReadonlyArray<Player.Id>;

        public constructor(bubblerId: Player.Id) {
            this.bubblerId = bubblerId;
        }

    }

}
