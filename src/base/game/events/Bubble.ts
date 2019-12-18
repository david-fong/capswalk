import { Player } from "../player/Player";
import { EventRecordEntry, PlayerGeneratedRequest } from "./EventRecordEntry";

/**
 * # The Object of the Game
 * 
 * (@object biddum-tss)
 * 
 * ## In Previous Versions
 * 
 * In the previous two versions of this game, I struggled to come up
 * with an interesting power action / mechanic for the player to use.
 * 
 * I worked with a backtracking action that allowed the player to move
 * back to previous positions (bounded by a variable length stack, and
 * in the second version, a length-bounded cycling stack). At the time,
 * I was realizing that those projects wouldn't be able to support
 * multiple players, which really limited my options in choosing an
 * objective for the game, and in turn, ideas for what secondary moves
 * could make achieving such an objective more interesting. In fact,
 * the backtracking mechanic worked against the player, since the
 * chaser would be hot on their trail!
 * 
 * Now that the game is multiplayer-capable, a lot of possibilities
 * have opened up because there is more for the player to interact
 * with.
 * 
 * ## The Objective at a Glance
 * 
 * The object of the game is to be the last team to have all their
 * members downed at the same time. As long as there is one member in
 * a team that has not been taken down, other downed members can still
 * be raised. Downed members can still move and take actions to assist
 * their teammates take down opposing players.
 * 
 * ## The Bubble Mechanic (How Players Get Taken Down)
 * 
 * At any given time, a player can (make a) "bubble". This starts a
 * countdown / timer during which they cannot move (the Game Manager,
 * who keeps the timer, will drop requests from a bubbling player).
 * 
 * At the end of the timer, the bubble will pop, and other players
 * within the range of their bubble will be affected by the pop based
 * on whether they are downed, whether they are on the same team as
 * the bubbling player, and whether the bubbling player is downed.
 * The range of the bubble can increase to include the typical range
 * of an affected player. A player who is bubbling is not immune to
 * the effects of another players' popping bubble.
 * 
 * The effects follow the following logical decision-making flow:
 * - Is the bubble-maker downed?
 *   - Yes: Is the other player a teammate?
 *     - Yes: Include their basic range. (too confusing?)
 *     - No: Other player is temporarily frozen. Is other player downed?
 *       - Yes: Include their basic range.
 *   - No: Is the other player a teammate?
 *     - Yes: Is the other player downed?
 *       - Yes: Other player is raised.
 *       - No: Include their basic range.
 *     - No: Other player is temporarily frozen. Is the other player downed?
 *       - Yes: Include their basic range. (move up?)
 *       - No: Other player gets downed (in addition to freezing).
 * 
 * Reject bubble requests from frozen players. This helps un-downed
 * players running from a downed enemy to escape if they can freeze
 * the enemy chasing them by ignoring "tag-back"-like actions.
 * 
 * The rationale for expanding ranges is to prevent turtling (Ie. for
 * downed teammates to gather around a non-downed teammate, blocking
 * access and preventing them from any possbility of getting downed).
 * Note that between teammates, an un-downed-player cannot bubble
 * through a downed 
 * 
 * Remember that all the variables taken into consideration are used
 * by the value they hold _when the bubble pops_ and _before_ any of
 * the resulting changes of the popping event take place.
 * 
 * The player can decrease the duration of the timer for their next
 * bubble by stockpiling score. The relative effect of their stockpile
 * can vary depending on factors that indicate how their team is doing
 * at the moment. The bias goes in a direction to sympathize with teams
 * that are faring poorly, or have a headcount-disadvantage. For more
 * imformation, see {@link computeTimerDuration}.
 * 
 */
export namespace Bubble {

    /**
     * An _inclusive_ lower bound on legal values. Ie. this value is
     * _just barely_ legal.
     * 
     * Units are the same as those in {@link computeTimerDuration}.
     */
    const MIN_TIMER_DURATION = 0_000;

    /**
     * An _inclusive_ upper bound on legal values. Ie. this value is
     * _just barely_ legal.
     * 
     * Units are the same as those in {@link computeTimerDuration}.
     */
    const MAX_TIMER_DURATION = 10_000;

    /**
     * @returns A positive real number representing how long it should
     * take for a new bubble made by the specified {@link Player} to pop
     * at the current time and under the current circumstances. Units
     * are in milliseconds.
     * 
     * The `percentCharged` field is an integer value out of 100%, and
     * is returned to make visual indications of how "dangerous" a player
     * currently is. If the player's stockpile is 0, then this value must
     * also be zero, and the timer duration must be the minimum possible
     * value.
     * 
     * This value...
     * - Strictly increases as `player`'s stockpile value increases.
     * - Strictly decreases as the game progresses (TODO: the measure
     *   of game progress has not been decided yet) to make it easier
     *   to organically end the game if it starts to last long.
     * - Scales to favour players in teams with a disadvantage in terms
     *   of headcount, and to mildly favour teams that are not doing as
     *   well as other teams.
     * 
     * **Important:** The returned value may have required this function
     * to perform constraining to be within legal bounds based on the
     * player's current stockpile. If not, then no changes in other
     * variables used by this function can cause the output to go out of
     * range. Whether constraining was performed is indicated in a field
     * of the returned object. Callers may use this to decide if fields
     * storing arguments to pass this function later should be changed.
     * 
     * @param player - 
     */
    export const computeTimerDuration = (player: Player): Readonly<{
        value: number,
        percentCharged: number,
        performedConstrain: boolean,
    }> => {
        // We are allowed to go below MIN_TIMER-DURATION based on the
        // player's stockpile value, but not because of how long the
        // game has lasted, or because of how the player's team is
        // faring. (according to the spec above).

        let value: number = 0xdeadbeef;
        let performedConstrain = false;
        // TODO

        // Perform cleaning and then return:
        if (value < MIN_TIMER_DURATION) {
            value = MIN_TIMER_DURATION;
            performedConstrain = true;
        } else if (value > MAX_TIMER_DURATION) {
            value = MAX_TIMER_DURATION;
            performedConstrain = true;
        }
        const percentCharged = ((100)
            * (value - MIN_TIMER_DURATION)
            / (MAX_TIMER_DURATION - MIN_TIMER_DURATION)
        );
        return {
            value,
            percentCharged,
            performedConstrain,
        };
    };



    /**
     * 
     */
    export class MakeEvent implements PlayerGeneratedRequest {

        public static readonly EVENT_NAME = "bubble-make";

        public eventId: number = EventRecordEntry.REJECT;

        public readonly playerId: Player.Id;

        public lastAcceptedRequestId: number;

        /**
         * Units are the same as those used in {@link computeTimerDuration}.
         * 
         * The server should ignore any values set here by the requester.
         * 
         * The server should set this to the value of the timer duration
         * that it will use to schedule the pop event.
         */
        public estimatedTimerDuration?: number = undefined;

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

        // map to how long to freeze (todo: say units are same as those in the bounds constants)
        public playersToFreeze: Readonly<Record<Player.Id, number>>;

        public constructor(bubblerId: Player.Id) {
            this.bubblerId = bubblerId;
        }

    }

}