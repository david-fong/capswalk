
/**
 * # The Object of the Game
 * 
 * @object (biddum-tss)
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
 */
export class PlayerPopEvent {

    // TODO: `public static MIN_TIMER_DURATION = 0;`
    // public static computeTimerDuration(stockPile: number, playerId: PlayerId);

    public constructor() {
        ;
    }

}
