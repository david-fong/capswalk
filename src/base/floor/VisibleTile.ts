import { HtmlHooks } from "utils/HtmlHooks";
import { Lang as LangTypeDefs } from "utils/TypeDefs";

import { Coord, Tile } from "./Tile";


/**
 * Implicitly handles visuals with help from CSS.
 *
 * Layers:
 * 0. Invisible cell layer (opaque on visual bell)
 * 1. Empty layer for spotlight mask
 * 2. Player face layer
 * 3. Language Written Character
 * 4. Language Type-able Sequence
 *
 * https://developer.mozilla.org/en-US/docs/Web/CSS/z-index
 * https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index
 * https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context
 *
 * Dataset:
 * Top-level layer has property "scoreValue"
 *
 * @extends Tile
 */
export class VisibleTile<S extends Coord.System> extends Tile<S> {

    public  readonly tileCellElem:      HTMLTableCellElement;
    private readonly langCharDivElem:   HTMLDivElement;
    private readonly langSeqDivElem:    HTMLDivElement;

    public constructor(coordDesc: Tile<S>["coord"]) {
        super(coordDesc);
        {
            const tCell = new HTMLTableCellElement();
            tCell.className = HtmlHooks.Tile.Class.BASE;
            {
                const cDiv = new HTMLDivElement();
                cDiv.className = HtmlHooks.Tile.Class.LANG_CHAR;
                tCell.appendChild(cDiv);
                this.langCharDivElem = cDiv;
            } {
                const sDiv = new HTMLDivElement();
                sDiv.className = HtmlHooks.Tile.Class.LANG_SEQ;
                tCell.appendChild(sDiv);
                this.langSeqDivElem = sDiv;
            }
            this.tileCellElem = tCell;
        }
    }


    /**
     * @override
     */
    public visualBell(): void {
        this.tileCellElem; // TODO
    }


    /**
     * @override
     */
    public evictOccupant(): void {
        super.evictOccupant();
        // TODO: call other setters that change visual appearance
    }

    /**
     * @override
     */
    public set scoreValue(score: number) {
        this._scoreValue = score;
        this.tileCellElem.dataset[HtmlHooks.Tile.DataSet.SCORE_VALUE] = score.toString();
    }

    /**
     * @override
     */
    public setLangCharSeq(charSeqPair: LangTypeDefs.CharSeqPair): void {
        super.setLangCharSeq(charSeqPair);
        this.langCharDivElem.innerText = this.langChar;
        this.langSeqDivElem.innerText  = this.langSeq;
    }

}
// Assert that this extension's constructor has a compatible signature:
VisibleTile as Tile.ClassIf<any>;
