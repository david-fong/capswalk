import { PlayerId } from "./Player";

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
     * 
     */
    export class MakeEvent {

        public static readonly EVENT_NAME = "bubble make";

        public constructor(playerId: PlayerId) {
            ;
        }

    }



    /**
     * 
     */
    export class PlayerPopEvent {

        public static readonly EVENT_NAME = "bubble pop";

        // TODO: `public static MIN_TIMER_DURATION = 0;`
        // public static computeTimerDuration(stockPile: number, playerId: PlayerId);

        public constructor(playerId: PlayerId) {
            ;
        }

    }

}
