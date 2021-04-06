import { JsUtils } from "defs/JsUtils";

/**
 * DOM / CSSOM Hook Strings
 *
 * Must be matched exactly in the html, css, and javascript.
 *
 * Dataset values are defined for the javascript domain. The CSS should
 * use the CSS-cased version with dash-separators.
 */
export namespace OmHooks {

export const ID = <const>{
	PUBLIC_GAME_SERVER_URLS: "public-game-hosts-list",
	CURRENT_HOST_GROUPS: "current-host-groups-list",
};

/**
 * See `:/src/style/utils.css`.
 */
export namespace General {
	export const Class = <const>{
		FILL_PARENT:        "fill-parent",
		CENTER_CONTENTS:    "center-contents",
		STACK_CONTENTS:     "stack-contents",
		INPUT_GROUP:        "input-group",
		INPUT_GROUP_ITEM:   "input-group-item",
	};
	export const Dataset = <const>{
		COLOUR_SCHEME: "skColourScheme",
	};
}

export namespace Player {
	export const Dataset = <const>{
		DOWNED: { KEY: "downed", VALUES: <const>{
			TEAM: "team", SELF: "self", NO: "no",
		}},
		FACE_SWATCH: "face",
	};
}

export namespace Screen {
	export const Id = <const>{
		ALL_SCREENS: "all-screens-container",
		SCREEN_TINT: "screen-tint",
	};
	export const Class = <const>{
		BASE:        "screen",
		NAV_NEXT:    "screen--next-button",
		NAV_PREV:    "screen--prev-button",
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