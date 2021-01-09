import { JsUtils } from "defs/JsUtils";
import type { Coord, Tile } from "floor/Tile";
import type { Grid as AbstractGrid } from "floor/Grid";
import { VisibleTile } from "floor/visible/VisibleTile";
import { VisibleGrid } from "floor/visible/VisibleGrid";

import { WrappedEuclid2 } from "./System";
import style from "./style.m.css";
type S = Coord.System.W_EUCLID2;

/**
 * @final
 */
export class Euclid2VisibleGrid extends WrappedEuclid2.Grid implements VisibleGrid<S> {

	readonly baseElem: HTMLElement;
	readonly spotlightElems: TU.RoArr<HTMLElement>;
	#tiles: TU.RoArr<VisibleTile>;

	public constructor(desc: AbstractGrid.CtorArgs<S>) {
		super(desc);

		const gridElem = JsUtils.mkEl("div", [style["grid"]]);
		gridElem.style.setProperty("--euclid2-grid-width", this.dimensions.width.toString());

		const tiles: Array<VisibleTile> = [];
		this.forEach((tile) => {
			const vTile = new VisibleTile();
			tiles.push(vTile);
			gridElem.appendChild(vTile.baseElem);
		});
		this.#tiles = tiles;

		Object.assign(this, VisibleGrid._mkExtensionProps(gridElem));
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