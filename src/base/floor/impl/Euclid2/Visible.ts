import { JsUtils } from "defs/JsUtils";
import { Lang, Player } from "defs/TypeDefs";
import type { Coord, Tile } from "floor/Tile";
import type { Grid as AbstractGrid } from "floor/Grid";
import { VisibleGrid } from "floor/visible/VisibleGrid";

import { WrappedEuclid2 } from "./System";
import style from "./style.m.css";
type S = Coord.System.W_EUCLID2;
const WIDTH = 1.67;

/** */
class VisibleTile implements TU.Pikk<Tile,"occId"|"health"|"char"> {

	public readonly back = JsUtils.svg("rect");
	readonly #char = JsUtils.svg("text");
	constructor() {
		this.back.setAttribute("height", WIDTH+"em");
		this.back.setAttribute("width", WIDTH+"em");
		//this.#char.setAttribute("x", ); // TODO.impl
	}
	public set occId(playerId: Player.Id) {
		if (playerId === Player.Id.NULL) {
			delete this.back.dataset["occId"];
		} else {
			this.back.dataset["occId"] = playerId.toString();
		}
	}
	public set health(health: Player.Health) {
		if (health > 0) {
			this.back.dataset["health"] = health.toString();
		} else {
			delete this.back.dataset["health"];
		}
	}
	public set char(char: Lang.Char) {
		this.#char.textContent = char;
	}
}
Object.freeze(VisibleTile);
Object.freeze(VisibleTile.prototype);

/**
 * @final
 */
export class Euclid2VisibleGrid extends WrappedEuclid2.Grid implements VisibleGrid<S> {

	readonly baseElem: HTMLElement;
	readonly spotlightElems: TU.RoArr<HTMLElement>;
	#tiles: TU.RoArr<VisibleTile>;

	public constructor(desc: AbstractGrid.CtorArgs<S>) {
		super(desc);

		const svg = JsUtils.svg("svg", [style["grid"]]);
		svg.setAttribute("height", (WIDTH * desc.dimensions.height) + "em");
		svg.setAttribute("width",  (WIDTH * desc.dimensions.width ) + "em");

		const tiles: Array<VisibleTile> = [];
		this.forEach((tile) => {
			const vTile = new VisibleTile();
			tiles.push(vTile);
			svg.appendChild(vTile.back);
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