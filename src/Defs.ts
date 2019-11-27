
/**
 * 
 */
export namespace Defs {

    /**
     * The maximum possible number of unoccupied twice-neighbouring
     * `Tile`s for any given `Tile` by this square `Grid` style.
     */
    export const MAX_NUM_U2NTS = (((2*2) + 1) ** 2) - 1;

    /**
     * The port that the {@link Server} will listen on.
     */
    export const SERVER_PORT = 8080;

    /**
     * See {@link GroupSession.constructor}.
     */
    export const GROUP_SESSION_INITIAL_TTL = 60;

}


export namespace HtmlIdHooks {

    /**
     * Should only have one child: the main game grid's display.
     */
    export const GRID = "game-grid-host";

}

export namespace HtmlClassHooks {

}
