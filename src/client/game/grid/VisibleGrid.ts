import style from "./grid.m.css";
import player_style from ":game/player/player.m.css";
import { JsUtils } from ":defs/JsUtils";

import type { Coord } from ":floor/Tile";
import type { Grid as BaseGrid } from ":floor/Grid";

interface _VisibleExtensions {
	readonly baseElem: HTMLElement;
	readonly spotlightElems: readonly HTMLElement[];
}

/** */
export interface VisibleGrid<S extends Coord.System> extends BaseGrid<S>, _VisibleExtensions {
}
export namespace VisibleGrid {

	// Each implementation must register itself into this dictionary.
	export const _Constructors: {
		readonly [ S in Coord.System ]: BaseGrid.ClassIf<S>
	} = {
		// These are initialized later to avoid bootstrapping issues.
		["W_EUCLID2"]: undefined!,
		["BEEHIVE"]: undefined!,
	};
	export const getImplementation = <S extends Coord.System>(coordSys: S): BaseGrid.ClassIf<S> => {
		const ctor = _Constructors[coordSys];
		return ctor as unknown as BaseGrid.ClassIf<S>;
	};

	export function _mkExtensionProps(tiles: HTMLElement): _VisibleExtensions {
		tiles.setAttribute("role", "presentation");
		tiles.translate  = false; // https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/translate
		tiles.spellcheck = false; // typically assumed by the UA, but it doesn't hurt to say explicitly.

		const base = JsUtils.html("div");
		const root = base.attachShadow({ mode: "closed" });
		tiles.classList.add(style["impl-body"]);
		root.appendChild(tiles);
		JsUtils.Web.adoptStyleSheet(root, "css-common.css");
		JsUtils.Web.adoptStyleSheet(root, "chunk/game-css.css");

		// Initialize spotlight elements:
		const shortSpotlight = JsUtils.html("div", [player_style["spotlight-short"]]);
		const longSpotlight  = JsUtils.html("div", [player_style["spotlight-long"]]);
		const spotlightElems = Object.freeze([ shortSpotlight, longSpotlight ]);

		return Object.freeze({
			baseElem: base,
			spotlightElems,
		});
	}
}
Object.freeze(VisibleGrid);