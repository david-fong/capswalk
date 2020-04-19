
/**
 * # DOM / CSSOM Hook Strings
 *
 * Must be matched exactly in the html, css, and javascript.
 *
 * Dataset values are defined for the javascript domain. The CSS should
 * use the CSS-cased version with dash-separators.
 */
export namespace OmHooks {

    /**
     * See `:/assets/style/utils.css`.
     */
    export const General = Object.freeze(<const>{
        Class: Object.freeze(<const>{
            TEXT_SELECT_DISABLED: "text-select-disabled",
            FILL_PARENT: "fill-parent",
        }),
    });


    export const Tile = Object.freeze(<const>{
        Class: Object.freeze(<const>{
            BASE:           "tile",
              UNSHIFT_HB:     "tile__unshift-hitbox",
                LANG_CHAR:      "tile__char",
                LANG_SEQ:       "tile__seq",
        }),
        Dataset: Object.freeze(<const>{
            HEALTH:     "health",
        }),
    });


    export const Grid = Object.freeze(<const>{
        Id: Object.freeze(<const>{
            /**
             * js/ts and html are allowed to prepend or append to this
             * string. The specified element should _only_ contain the
             * grid element. Anything else will be removed by js/ts.
             */
            GRID:       "game-grid",
        }),
        Class: Object.freeze(<const>{
            GRID:           "game-grid",
              IMPL_BODY:      "game-grid__impl-body",
                SPOTLIGHT:      "game-grid__spotlight",
              KBD_DC_ICON:    "game-grid__kbd-dc-icon",
        }),
        Dataset: Object.freeze(<const>{
            /**
             * Used as a part of CSS selector queries to specify coord-
             * system-specific styling.
             */
            COORD_SYS:  "coordSys",
        }),
    });


    export const Player = Object.freeze(<const>{
        Class: Object.freeze(<const>{
            BASE:       "player",
              DOWNED_OVERLAY: "player__downed-overlay",
        }),
        Dataset: Object.freeze(<const>{
            DOWNED:     "downed",
            FACE_SWATCH:"face",
        }),
    });


    export const Display = Object.freeze(<const>{
        Class: Object.freeze(<const>{
            BASE:       "display",
        }),
    });


    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
     * https://www.w3schools.com/html/html5_webstorage.asp
     */
    export const WebStorageKeys = Object.freeze(<const>{
        RecentCoordSystem: "recent-coord-system",
        RecentLang: "recent-lang",
    });

    type HookDict = {
        [ DictKey in "Id" | "Class" | "Dataset" ]?: Readonly<{
            [ JsHook: string ]: string;
        }>;
    };

}
Object.freeze(OmHooks);
