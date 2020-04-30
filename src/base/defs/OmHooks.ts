
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
    export namespace General {
        export const Class = <const>{
            TEXT_SELECT_DISABLED: "text-select-disabled",
            FILL_PARENT: "fill-parent",
            CENTER_CONTENTS: "center-contents",
            STACK_CONTENTS: "stack-contents",
        };
        export const Id = <const>{
            COLOUR_STORE: "colour-store",
        };
    }

    export namespace Tile {
        export const Class = <const>{
            BASE:           "tile",
            /**
             * Must precede the char and seq elements to allow CSS
             * to use the variable-distance same-parent precede
             * selection operator ("~").
             */
            POINTER_HB:     "tile__pointer-hitbox",
            LANG_CHAR:      "tile__char",
            LANG_SEQ:       "tile__seq",
        };
        export const Dataset = <const>{
            HEALTH:         "health",
        };
    }

    export namespace Grid {
        export const Class = <const>{
            GRID:           "game-grid",
            IMPL_BODY:      "game-grid-impl-body",
            KBD_DC_BASE:    "game-grid-kbd-dc",
            KBD_DC_ICON:    "game-grid-kbd-dc__icon",
        };
        export const Dataset = <const>{
            /**
             * Used as a part of CSS selector queries to specify coord-
             * system-specific styling.
             */
            COORD_SYS:  "coordSys",
        };
    }

    export namespace Player {
        export const Class = <const>{
            BASE:           "player",
            FACE:           "player__face",
            DOWNED_OVERLAY: "player__downed-overlay",
            SHORT_SPOTLIGHT:"player__spotlight-short",
            LONG_SPOTLIGHT: "player__spotlight-long",
        };
        export const Dataset = <const>{
            DOWNED:         "downed",
            FACE_SWATCH:    "face",
        };
    }

    export namespace Screen {
        export const Id = <const>{
            ALL_SCREENS:    "all-screens-container",
            SCREEN_TINT:    "screen-tint",
        };
        export const Class = <const>{
            BASE:           "sk-screen",
        };
        export const Dataset = <const>{
            CURRENT:        "current",
        };
        export namespace Impl {
            export namespace Home {
            }
            export namespace PlayGame {
                export const Class = <const>{
                    GRID_CONTAINER: "sks-pg--grid-container",
                };
            }
        }
    }
}
function deepFreeze(obj: any): void {
    for (const propName of Object.getOwnPropertyNames(obj)) {
        const val = obj[propName];
        if (val && typeof val === "object") {
            deepFreeze(val);
        }
    }
    return Object.freeze(obj);
}
deepFreeze(OmHooks);
