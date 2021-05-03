import style from "./grid.m.css";
import player_style from ":game/player/player.m.css";
import { JsUtils } from ":defs/JsUtils";

import type { Coord } from ":floor/Tile";
import type { Grid as BaseGrid } from ":floor/Grid";

interface _VisibleExtensions {
	readonly baseElem: HTMLElement;
}

/** */
export interface VisibleGrid<S extends Coord.System> extends BaseGrid<S>, _VisibleExtensions {
}
export namespace VisibleGrid {

	export function _mkExtensionProps(tiles: HTMLElement): _VisibleExtensions {
		tiles.setAttribute("role", "presentation");
		tiles.translate  = false; // https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/translate
		tiles.spellcheck = false; // typically assumed by the UA, but it doesn't hurt to say explicitly.

		const outer = JsUtils.html("div");
		outer.setAttribute("role", "presentation");
		const inner = outer.attachShadow({ mode: "closed" });
		tiles.classList.add(style["impl-body"]);
		inner.appendChild(tiles);
		JsUtils.Web.adoptStyleSheet(inner, "css-common.css");
		JsUtils.Web.adoptStyleSheet(inner, "chunk/game-css.css");

		return Object.freeze({
			baseElem: outer,
		});
	}
}
Object.freeze(VisibleGrid);