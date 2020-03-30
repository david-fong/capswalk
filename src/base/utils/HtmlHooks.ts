
/**
 * Must be matched exactly in the html, css, and javascript.
 */
export namespace HtmlHooks {

    export namespace Tile {
        export const Class = Object.freeze(<const>{
            BASE:       "tile",
            LANG_CHAR:  "tile__char",
            LANG_SEQ:   "tile__seq",
        });
        export const DataSet = Object.freeze(<const>{
            SCORE_VALUE: "scoreValue",
        });
    }

    export namespace Player {
        export const Class = Object.freeze(<const>{
            BASE: "player",
        });
    }

}