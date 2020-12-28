import { JsUtils } from "defs/JsUtils";
import { OmHooks } from "defs/OmHooks";
import { Lang, Player } from "defs/TypeDefs";

import type { Tile } from "../Tile";
import style from "./tile.m.css";

/**
 * Implicitly handles visuals with help from CSS.
 */
export class VisibleTile implements TU.Pikk<Tile,"occId"|"health"|"char"> {

	public readonly baseElem = JsUtils.mkEl("div", [
		OmHooks.General.Class.CENTER_CONTENTS,
		OmHooks.General.Class.STACK_CONTENTS,
		style["this"],
	]);
	private readonly charElem = JsUtils.mkEl("div", []);

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
	public set health(health: Player.Health) {
		if (health > 0) {
			this.baseElem.dataset["health"] = health.toString();
		} else {
			delete this.baseElem.dataset["health"];
		}
	}
	public set char(char: Lang.Char) {
		this.charElem.textContent = char;
	}
}
Object.freeze(VisibleTile);
Object.freeze(VisibleTile.prototype);