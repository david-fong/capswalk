import { JsUtils } from "defs/JsUtils";
import { Lang, Player } from "defs/TypeDefs";
import type { Coord, Tile } from "floor/Tile";
import type { Grid as AbstractGrid } from "floor/Grid";
import { VisibleGrid } from "floor/visible/VisibleGrid";

import { WrappedEuclid2 as System } from "./System";
import style from "./style.m.css";
type S = Coord.System.W_EUCLID2;
const WIDTH = 1.4; // <- must be set to match the stylesheet values.
const GAP = 0.25;

/** */
class VisibleTile implements TU.Pikk<Tile,"occId"|"health"> {

	public readonly body = JsUtils.svg("rect");
	public readonly _char = JsUtils.svg("text");

	constructor(iac: System.Grid["iacCache"][number]) {
		const xOffset = ((WIDTH+GAP)*iac.x+GAP);
		const yOffset = ((WIDTH+GAP)*iac.y+GAP);

		this.body.classList.add(style.tile);
		const bodyAttr = this.body.setAttributeNS.bind(this.body, null);
		bodyAttr("x", xOffset+"em");
		bodyAttr("y", yOffset+"em");

		this._char.classList.add(style.char);
		this._char.setAttributeNS(null, "x", xOffset+(WIDTH/2)+"em");
		this._char.setAttributeNS(null, "y", yOffset+(WIDTH/2)+"em");
	}
	public set occId(playerId: Player.Id) {
		if (playerId === Player.Id.NULL) {
			delete this.body.dataset["occId"];
		} else {
			this.body.dataset["occId"] = playerId.toString();
		}
	}
	public set health(health: Player.Health) {
		if (health > 0) {
			this.body.dataset["health"] = health.toString();
		} else {
			delete this.body.dataset["health"];
		}
	}
	public set char(char: string) {
		this._char.textContent = char;
	}
}
Object.freeze(VisibleTile);
Object.freeze(VisibleTile.prototype);

/**
 * @final
 */
export class Euclid2VisibleGrid extends System.Grid implements VisibleGrid<S> {

	readonly baseElem: HTMLElement;
	readonly spotlightElems: ReadonlyArray<HTMLElement>;
	#tiles: ReadonlyArray<VisibleTile>;

	public constructor(desc: AbstractGrid.CtorArgs<S>) {
		super(desc);

		const svg = JsUtils.svg("svg", [style["grid"]]);
		const dim = desc.dimensions;
		svg.setAttribute("height", ((WIDTH+GAP) * dim.height + GAP) + "em");
		svg.setAttribute("width",  ((WIDTH+GAP) * dim.width  + GAP) + "em");

		const tiles: Array<VisibleTile> = [];
		this.forEach((tile) => {
			const vTile = new VisibleTile(this.iacCache[tile.coord]!);
			tiles.push(vTile);
			svg.appendChild(vTile.body);
			svg.appendChild(vTile._char);
		});
		this.#tiles = tiles;

		const wrapper = JsUtils.html("div");
		wrapper.appendChild(svg);
		Object.assign(this, VisibleGrid._mkExtensionProps(wrapper));
		Object.seal(this); //🧊
	}

	/** @override */
	public write(coord: Coord, changes: Tile.Changes): void {
		super.write(coord, changes);
		const tile = this.#tiles[coord]!;
		if (JsUtils.hasProp(changes, "occId")) {
			tile.occId = changes.occId!;
		}
		if (JsUtils.hasProp(changes, "health")) {
			tile.health = changes.health!;
		}
		if (JsUtils.hasProp(changes, "char")) {
			tile.char = changes.char!;
		}
	}
}
Object.freeze(Euclid2VisibleGrid);
Object.freeze(Euclid2VisibleGrid.prototype);