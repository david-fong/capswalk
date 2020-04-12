
/**
 * Must be matched exactly in the html, css, and javascript.
 */
export namespace WebHooks {

    export namespace Tile {
        export const Class = Object.freeze(<const>{
            BASE:       "tile",
            LANG_CHAR:  "tile__char",
            LANG_SEQ:   "tile__seq",
        });
        export const Dataset = Object.freeze(<const>{
            SCORE_VALUE: "scoreValue",
        });
    }

    export namespace Grid {
        export const Id = Object.freeze(<const>{
            GRID:   "game-grid-host",
        });
    }

    export namespace Player {
        export const Class = Object.freeze(<const>{
            BASE: "player",
        });
        export const Dataset = Object.freeze(<const>{
            IS_DOWNED:  "isDowned"
        });
    }

}
