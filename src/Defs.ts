
/**
 * 
 */
export class Defs {

    /**
     * The maximum possible number of unoccupied twice-neighbouring
     * `Tile`s for any given `Tile` by this square `Grid` style.
     */
    public static readonly MAX_NUM_U2NTS: number = (((2*2) + 1) ** 2) - 1;

    /**
     * The port that the {@link Server} will listen on.
     */
    public static readonly SERVER_PORT: number = <const>8080;

}


export class HtmlHooks {

    public static readonly GRID: string = <const>"grid";

}

export class CssHooks {

}
