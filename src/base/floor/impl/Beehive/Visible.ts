import CSS from "./style.m.css";
import { JsUtils } from "defs/JsUtils";
import type { Coord as BaseCoord } from "floor/Tile";
import type { Grid as AbstractGrid } from "floor/Grid";
import { VisibleGrid, VisibleGridMixin } from "floor/VisibleGrid";
import { Beehive } from "./System";
type S = BaseCoord.System.BEEHIVE;

/**
 */
// Separated for tree-shaking.
export class BeehiveVisibleGrid extends Beehive.Grid implements VisibleGrid<S> {
	public constructor(desc: AbstractGrid.CtorArgs<S>) {
		super(desc);
		const domGrid: HTMLElement = undefined!;
		// TODO.impl Beehive VisibleGrid ctor.
		this._superVisibleGrid(desc, domGrid);
		domGrid.classList.add(CSS["grid"]);
	}
}
export interface BeehiveVisibleGrid extends VisibleGridMixin<S> { };
JsUtils.applyMixins(BeehiveVisibleGrid, [VisibleGridMixin]);
Object.freeze(BeehiveVisibleGrid);
Object.freeze(BeehiveVisibleGrid.prototype);