import { JsUtils } from "defs/JsUtils";
import { OmHooks } from "defs/OmHooks";
import type { Lang, Player } from "defs/TypeDefs";

import type { Coord, Tile } from "../Tile";
import style from "./tile.m.css";

/**
 * Implicitly handles visuals with help from CSS.
 */
export class VisibleTile implements TU.Pikk<Tile,"occId"|"health"|"char"> {

	public  readonly baseElem: HTMLDivElement;
	private readonly charElem: HTMLDivElement;

	public constructor() {
		{
			const base = this.baseElem = JsUtils.mkEl("div", [
				OmHooks.General.Class.CENTER_CONTENTS,
				OmHooks.General.Class.STACK_CONTENTS,
				style["this"],
			]);
			base.setAttribute("aria-label", "Tile");
		}{
			const charWrap = JsUtils.mkEl("div", [style["char"]]);
			charWrap.setAttribute("role", "presentation");
			const charElem = this.charElem = JsUtils.mkEl("div", []);
			charWrap.appendChild(charElem);
			this.baseElem.appendChild(charWrap);
		}
		JsUtils.propNoWrite(this as VisibleTile, "charElem");
	}

	public set occId(playerId: Player.Id) {
		//this.charElem.parentElement!.insertAdjacentElement("beforebegin", immigrantInfo.playerElem);
	}
	public set health(health: Player.Health) {
		if (health > 0) {
			this.baseElem.dataset[OmHooks.Tile.Dataset.HEALTH] = health.toString();
		} else {
			delete this.baseElem.dataset[OmHooks.Tile.Dataset.HEALTH];
		}
	}
	public set char(char: Lang.Char) {
		this.charElem.textContent = char;
	}
}
Object.freeze(VisibleTile);
Object.freeze(VisibleTile.prototype);