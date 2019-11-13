
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

    export const GRID = "grid";

}

export namespace HtmlClassHooks {

}
