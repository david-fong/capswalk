
/**
 * Global definitions of event names. Mostly used in both directions.
 * TODO: change these to enums
 */
export class EventNames {

    /**
     * Create a game session from the gamehosts namespace.
     * Client initiates with no arguments.
     * Server responds with the name of the namespace of the new
     *      {@link GroupSession}, and its initial TTL (see
     *      {@link GroupSession.constructor}).
     */
    public static readonly CREATE_SESSION = <const>"create session";

    /**
     * Dump game state
     */
    public static readonly DUMP_GAME_STATE = <const>"dump game state";

    /**
     * Player movement.
     * Client initiates with `id` and `dest` through player method.
     * Server validates request, and if accepted, broadcasts to all
     *      clients with {@link PlayerMovementDesc}.
     */
    public static readonly PLAYER_MOVEMENT = <const>"player movement";

    /**
     * Language change.
     */
    public static readonly LANGUAGE_CHANGE = <const>"language change";

}
