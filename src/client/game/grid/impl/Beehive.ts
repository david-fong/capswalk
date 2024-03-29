import { JsUtils } from ":defs/JsUtils";
import type { Coord, Tile } from ":floor/Tile";
import type { Grid } from ":floor/Grid";
import { Beehive } from ":floor/impl/Beehive";
import { VisibleGrid } from "../VisibleGrid";
type S = Coord.System.BEEHIVE;

/**
 * @final
 */
export class BeehiveVisibleGrid extends Beehive.Grid implements VisibleGrid<S> {

	readonly baseElem: HTMLElement;

	public constructor(desc: Grid.CtorArgs<S>) {
		super(desc);
		const domGrid: HTMLElement = undefined!;
		Object.assign(this, VisibleGrid._mkExtensionProps(domGrid));
		Object.seal(this); //🧊
	}

	public override write(coord: Coord, changes: Tile.Changes): void {
		// TODO.impl
	}
}
Object.freeze(BeehiveVisibleGrid);
Object.freeze(BeehiveVisibleGrid.prototype);