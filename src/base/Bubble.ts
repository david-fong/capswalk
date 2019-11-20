import { PlayerId, Player } from "src/base/Player";

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
 * ### The Bubble Mechanic (How Players Get Taken Down)
 * 
 * At any given time, a player can (make a) "bubble". This starts a
 * countdown / timer during which they cannot move (the Game Manager,
 * who keeps the timer, will drop requests from a bubbling player).
 * 
 * At the end of the timer, the bubble will pop, and other players
 * within the range of their bubble will be affected by the pop based
 * on whether they are downed, whether they are on the same team as
 * the bubbling player, and whether the bubbling player is downed.
 * 
 * The player can decrease the duration of the timer for their next
 * bubble by stockpiling score. The relative effect of their stockpile
 * can vary depending on factors that indicate how their team is doing
 * at the moment. The bias goes in a direction to sympathize with teams
 * that are faring poorly, or have a headcount-disadvantage.
 * 
 */
export namespace Bubble {

    /**
     * An _inclusive_ lower bound on legal values.
     * 
     * Units are in milliseconds.
     */
    export const MIN_TIMER_DURATION = 0;

    /**
     * @returns A positive real number representing how long it should
     * take for a new bubble made by the specified {@link Player} to pop
     * at the current time and under the current circumstances. Units
     * are the same as those used by {@link MIN_TIMER_DURATION}.
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
     * **Important:** The returned value may be less than
     * {@link MIN_TIMER_DURATION} based on the player's current
     * stockpile. If the produced value is within that range, then no
     * reasonable changes in other variables used by this function can
     * cause the output to go out of range.
     * 
     * Therefore, external callers of this function must manually
     * constrain the returned value into the required range.
     * 
     * @param player - 
     */
    export const computeTimerDuration = (player: Player): number => {
        // We are allowed to go below MIN_TIMER-DURATION based on the
        // player's stockpile value, but not because of how long the
        // game has lasted, or because of how the player's team is
        // faring. (according to the spec above).

        // TODO
        return MIN_TIMER_DURATION;
    };



    /**
     * 
     */
    export class MakeEvent {

        public static readonly EVENT_NAME = "bubble make";

        public readonly playerId: PlayerId;

        /**
         * See the field by the same name in {@link PlayerMovementEvent}.
         */
        public lastAccpectedRequestId: number;

        /**
         * Units are the same as those used for {@link MIN_TIMER_DURATION}.
         * 
         * The server should ignore any values set here by the requester.
         * 
         * The server should set this to the value of the timer duration
         * that it will use to schedule the pop event.
         */
        public readonly estimatedTimerDuration: number;

        public constructor(playerId: PlayerId) {
            ;
        }

    }



    /**
     * This descriptor is only ever used to send event information
     * from the server to clients.
     */
    export class PopEvent {

        public static readonly EVENT_NAME = "bubble pop";

        public readonly bubblerId: PlayerId;

        public readonly playersToDown: Readonly<PlayerId>;

        public readonly playersToRaise: Readonly<PlayerId>;

        // TODO: players to freeze?

        public constructor(/* TODO */) {
            ;
        }

    }

}
