
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
            CENTER_CONTENTS: "center-contents",
            STACK_CONTENTS: "stack-contents",
        }),
    });


    export const Tile = Object.freeze(<const>{
        Class: Object.freeze(<const>{
            BASE:           "tile",
            /**
             * Must precede the char and seq elements to allow CSS
             * to use the variable-distance same-parent precede
             * selection operator ("~").
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
            IMPL_BODY:      "game-grid-impl-body",
            KBD_DC_BASE:    "game-grid-kbd-dc",
            KBD_DC_ICON:    "game-grid-kbd-dc__icon",
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
            BASE:           "player",
            FACE:           "player__face",
            DOWNED_OVERLAY: "player__downed-overlay",
            SHORT_SPOTLIGHT:"player__spotlight-short",
            LONG_SPOTLIGHT: "player__spotlight-long",
        }),
        Dataset: Object.freeze(<const>{
            DOWNED:         "downed",
            FACE_SWATCH:    "face",
        }),
    });


    export const Screen = Object.freeze(<const>{
        Id: Object.freeze(<const>{
            ALL_SCREENS: "all-screens-container",
        }),
        Class: Object.freeze(<const>{
            BASE:       "screen",
        }),
        Dataset: Object.freeze(<const>{
            CURRENT:    "current",
        }),
        Impl: Object.freeze({
            Home: Object.freeze(<const>{
            }),
            PlayGame: Object.freeze(<const>{
                Class: Object.freeze(<const>{
                    GRID_CONTAINER: "sks-pg--grid-container",
                }),
            }),
        }),
    });
    export namespace Screen {  }
}
Object.freeze(OmHooks);
