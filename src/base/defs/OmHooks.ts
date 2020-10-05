import { deepFreeze } from "defs/TypeDefs";

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
    export const Class = <const>{
        BASE:           "tile",
        /**
         * Must precede the char and seq elements to allow CSS
         * to use the variable-distance same-parent precede
         * selection operator ("~").
         */
        POINTER_HB:     "tile__pointer-hitbox",
        LANG_CHAR_WRAP: "tile__char",
        LANG_SEQ:       "tile__seq",
    };
    export const Dataset = <const>{
        HEALTH:         "health",
    };
}

export namespace Grid {
    export const Class = <const>{
        GRID:           "game-grid",
        SCROLL_OUTER:   "game-grid-scroll-outer",
        SCROLL_INNER:   "game-grid-scroll-inner",
        IMPL_BODY:      "game-grid-impl-body",
        KBD_DC:         "game-grid-kbd-dc",
        KBD_DC_ICON:    "game-grid-kbd-dc__icon",
        PAUSE_OL:       "game-grid-pause-overlay",
        PAUSE_OL_ICON:  "game-grid-pause-overlay__icon",
        PLAYER_IOB_ROOT:"grid-player-intersection-root"
    };
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
        },},
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
        DOWNED: { KEY: "downed", VALUES: <const>{
            TEAM: "team", SELF: "self", NO: "no",
        },},
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
        NAV_PREV:       "screen--back-button",
    };
    export const Dataset = <const>{
        CURRENT:        "current",
    };
    export namespace Impl {
    export namespace Home {
        export const Class = <const>{
            BASE:               "screen-home",
            NAV:                "screen-home--nav",
            NAV_PLAY_OFFLINE:   "screen-home--nav--play-offline",
            NAV_PLAY_ONLINE:    "screen-home--nav--play-online",
            NAV_HOW_TO_PLAY:    "screen-home--nav--how-to-play",
            NAV_HOW_TO_HOST:    "screen-home--nav--how-to-host",
            NAV_COLOURS:        "screen-home--nav--colour-scheme",
            NAV_VIEW_REPO:      "screen-home--nav--goto-repo",
            NAV_RPT_ISSUE:      "screen-home--nav--report-issue",
        };
    }
    export namespace ColourCtrl {
        export const Class = <const>{
            BASE:               "screen-colour",
            OPTION:             "screen-colour--opt",
            OPTION_LABEL:       "screen-colour--opt-label",
            OPTION_PREVIEW:     "screen-colour--opt-preview",
        };
    }
    export namespace Play {
        export const Class = <const>{
            BASE:               "screen-play",
            GRID_WRAPPER:       "screen-play--grid-wrapper",
            CONTROLS_BAR:       "screen-play--controls-bar",
            PLAYERS_BAR:        "screen-play--players-bar",
        };
    }
    export namespace Setup {
        export const Class = <const>{
            BASE:               "screen-setup",
            LANG_SEL:           "screen-setup--lang-sel",
            LANG_WEIGHT_EXAGG:  "screen-setup--lang-weight-exagg",
        };
        export const Id = <const>{
            LANG_WEIGHT_EXAGGERATION_LIST: "screen-setup--lang-weight-exaggeration-list",
        };
    }
    export namespace GroupJoiner {
        export const Class = <const>{
            BASE:               "screen-joiner",
            CONTENT_WRAPPER:    "screen-joiner--content-wrapper",
            HOST_URL:           "screen-joiner--host-url",
            GROUP_NAME:         "screen-joiner--group-name",
            PASSPHRASE:         "screen-joiner--passphrase",
        };
    }
    export namespace GroupLobby {
        export const Class = <const>{
            BASE:               "screen-lobby",
            SEC_CLIENT_INFO:    "screen-lobby--client-info-section",
            SEC_TEAMS:          "screen-lobby--teams-section",
            TEAM:               "screen-lobby-team",
            PLAYER:             "screen-lobby-player",
        };
    }
    }
}

export namespace SkPickOne {
    export const Class = <const>{
        BASE:           "sk-pick-one",
        OPT_BASE:       "sk-pick-one--opt",
    };
}
}
Object.freeze(OmHooks.Player.Dataset.DOWNED); // String with properties.
deepFreeze(OmHooks);
