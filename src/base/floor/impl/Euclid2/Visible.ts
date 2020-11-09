import "./style.m.css";
import { JsUtils } from "defs/JsUtils";
import type { Coord as BaseCoord } from "floor/Tile";
import type { VisibleTile } from "floor/VisibleTile";
import type { Grid as AbstractGrid } from "floor/Grid";
import { Euclid2 } from "./System";
import { VisibleGrid, VisibleGridMixin } from "floor/VisibleGrid";
type S = BaseCoord.System.EUCLID2;

/**
 */
// Separated for tree-shaking.
export class Euclid2VisibleGrid extends Euclid2.Grid implements VisibleGrid<S> {
    /**
     * @override
     */
    declare protected readonly grid: TU.RoArr<TU.RoArr<VisibleTile<S>>>;

    public constructor(desc: AbstractGrid.CtorArgs<S>) {
        super(desc);
        const gridElem = JsUtils.mkEl("div", []);
        gridElem.style.setProperty("--euclid2-grid-width",  this.dimensions.width.toString());
        // At below use of for loop without breaks: For shallower stack when debugging.
        for (const row of this.grid) {
            for (const tile of row) {
                tile._addToDom(gridElem);
            }
        }
        this._superVisibleGrid(desc, gridElem);
    }
}
export interface Euclid2VisibleGrid extends VisibleGridMixin<S> { };
JsUtils.applyMixins(Euclid2VisibleGrid, [VisibleGridMixin]);
Object.freeze(Euclid2VisibleGrid);
Object.freeze(Euclid2VisibleGrid.prototype);