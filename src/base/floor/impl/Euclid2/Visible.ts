import { JsUtils } from "defs/JsUtils";
import type { Coord as BaseCoord } from "floor/Tile";
import type { Grid as AbstractGrid } from "floor/Grid";
import { WrappedEuclid2 } from "./System";
import { VisibleGrid, VisibleGridMixin } from "floor/VisibleGrid";
type S = BaseCoord.System.W_EUCLID2;

/**
 */
// Separated for tree-shaking.
export class Euclid2VisibleGrid extends WrappedEuclid2.Grid implements VisibleGrid<S> {
	public constructor(desc: AbstractGrid.CtorArgs<S>) {
		super(desc);
		const gridElem = JsUtils.mkEl("div", []);
		gridElem.style.setProperty("--euclid2-grid-width",  this.dimensions.width.toString());
		this._superVisibleGrid(gridElem);
	}
}
export interface Euclid2VisibleGrid extends VisibleGridMixin<S> { };
JsUtils.applyMixins(Euclid2VisibleGrid, [VisibleGridMixin]);
Object.freeze(Euclid2VisibleGrid);
Object.freeze(Euclid2VisibleGrid.prototype);