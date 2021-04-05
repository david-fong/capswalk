import { JsUtils } from "defs/JsUtils";
import { Player } from "defs/TypeDefs";

import type { Tile } from "../Tile";
import style from "./tile.m.css";

/**
 * Implicitly handles visuals with help from CSS.
 */
export class VisibleTile implements TU.Pikk<Tile,"occId"> {

	public readonly baseElem = JsUtils.html("div", [style["this"]]);
	private readonly charElem = JsUtils.html("div", []);

	public constructor() {
		const base = this.baseElem;
		base.setAttribute("role", "presentation");
		base.appendChild(this.charElem);
		Object.freeze(this);
	}

	public set occId(playerId: Player.Id) {
		if (playerId === Player.Id.NULL) {
			delete this.baseElem.dataset["occId"];
		} else {
			this.baseElem.dataset["occId"] = playerId.toString();
		}
	}
	public set char(char: string) {
		this.charElem.textContent = char;
	}
}
Object.freeze(VisibleTile);
Object.freeze(VisibleTile.prototype);