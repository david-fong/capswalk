import { JsUtils } from "defs/JsUtils";
import type { Coord as BaseCoord } from "floor/Tile";
import type { Grid as AbstractGrid } from "floor/Grid";
import { Beehive } from "./System";
import { VisibleGrid, VisibleGridMixin } from "floor/visible/VisibleGrid";
type S = BaseCoord.System.BEEHIVE;

/**
 */
export class BeehiveVisibleGrid extends Beehive.Grid implements VisibleGrid<S> {
	public constructor(desc: AbstractGrid.CtorArgs<S>) {
		super(desc);
		const domGrid: HTMLElement = undefined!;
		this._superVisibleGrid(domGrid);
	}
}
export interface BeehiveVisibleGrid extends VisibleGridMixin { };
JsUtils.applyMixins(BeehiveVisibleGrid, [VisibleGridMixin]);
Object.freeze(BeehiveVisibleGrid);
Object.freeze(BeehiveVisibleGrid.prototype);