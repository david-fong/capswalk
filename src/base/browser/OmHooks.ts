
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
            /**
             * Must be the first child to allow CSS to use the variable-
             * distance same-parent precede selection operator.
             */
            POINTER_HB:     "tile__pointer-hitbox",
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
            /**
             * Must be the first child because it is the element that
             * can take focus (tabIndex = 0). It needs to be that way
             * so that its onkeydown handler (which references a Game
             * object) will get GC'd with it when removed from the DOM.
             * The keyboard-disconnected overlay is a sibling whose
             * CSS visibility depends on whether this element has focus
             * or not.
             */
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


    export const Screen = Object.freeze(<const>{
        Class: Object.freeze(<const>{
            BASE:       "screen",
        }),
        Dataset: Object.freeze(<const>{
            CURRENT:    "current",
        }),
    });
}
Object.freeze(OmHooks);
