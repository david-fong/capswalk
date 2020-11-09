import { JsUtils } from "defs/JsUtils";

/**
 * # DOM / CSSOM Hook Strings
 *
 * Must be matched exactly in the html, css, and javascript.
 *
 * Dataset values are defined for the javascript domain. The CSS should
 * use the CSS-cased version with dash-separators.
 */
export namespace OmHooks {

export const GLOBAL_IDS = <const>{
    PUBLIC_GAME_HOST_URLS:  "public-game-hosts-list",
    CURRENT_HOST_GROUPS:    "current-host-groups-list",
};

/**
 * See `:/assets/style/utils.css`.
 */
export namespace General {
    export const Class = <const>{
        TEXT_SELECT_DISABLED: "text-select-disabled",
        FILL_PARENT:        "fill-parent",
        CENTER_CONTENTS:    "center-contents",
        STACK_CONTENTS:     "stack-contents",
        INPUT_GROUP:        "sk-input-group",
        INPUT_GROUP_ITEM:   "sk-input-group-item",
    };
    export const Dataset = <const>{
        COLOUR_SCHEME: "skColourScheme",
    };
}

export namespace Tile {
    export const Dataset = <const>{
        HEALTH:         "health",
    };
}

export namespace Grid {
    export const Dataset = <const>{
        /**
         * Used as a part of CSS selector queries to specify coord-
         * system-specific styling. This is set on the `impl-body`
         * element. See `VisibleGridMixin`.
         */
        IMPL_COORD_SYS:  "coordSys",
        /**
         * This is set on the `game-grid` element by `__PlayScreen`.
         */
        GAME_STATE: { KEY: "gameState", VALUES: <const>{
            PLAYING: "playing", PAUSED: "paused", OVER: "over",
        }},
    };
}

export namespace Player {
    export const Dataset = <const>{
        DOWNED: { KEY: "downed", VALUES: <const>{
            TEAM: "team", SELF: "self", NO: "no",
        }},
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
        NAV_NEXT:       "screen--next-button",
        NAV_PREV:       "screen--prev-button",
    };
    export const Dataset = <const>{
        CURRENT:        "current",
    };
    export namespace Impl {
        export namespace Setup {
            export const Id = <const>{
                LANG_WEIGHT_EXAGGERATION_LIST: "screen-setup--lang-weight-exaggeration-list",
            };
        }
    }
}
}
JsUtils.deepFreeze(OmHooks);