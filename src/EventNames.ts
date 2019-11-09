
/**
 * 
 */
export enum SocketIoNamespaces {
    ROOT = "/",
}



/**
 * Global definitions of event names. Mostly used in both directions.
 * TODO: change these to enums
 */
export class EventNames {

    public static readonly ASSIGN_PLAYER_ID = <const>"assign player id";

    /**
     * Dump game state
     */
    public static readonly DUMP_GAME_STATE = <const>"dump game state";

    /**
     * Player movement.
     */
    public static readonly PLAYER_MOVEMENT = <const>"player movement";

    /**
     * Language change.
     */
    public static readonly LANGUAGE_CHANGE = <const>"language change";

}
