import { WebHooks } from "../../browser/WebHooks";
import type { Lang } from "utils/TypeDefs";

import { Coord, Tile } from "./Tile";

export { Coord } from "./Tile";


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

    public  readonly tileElem:      HTMLTableCellElement;
    private readonly langCharElem:  HTMLDivElement;
    private readonly langSeqElem:   HTMLDivElement;

    public constructor(coordDesc: Tile<S>["coord"]) {
        super(coordDesc);
        {
            const tCell = document.createElement("td");
            tCell.className = WebHooks.Tile.Class.BASE;
            {
                const cDiv = document.createElement("div");
                cDiv.className = WebHooks.Tile.Class.LANG_CHAR;
                cDiv.classList.add(WebHooks.General.Class.FILL_PARENT);
                tCell.appendChild(cDiv);
                this.langCharElem = cDiv;
            } {
                const sDiv = document.createElement("div");
                sDiv.className = WebHooks.Tile.Class.LANG_SEQ;
                tCell.appendChild(sDiv);
                this.langSeqElem = sDiv;
            }
            this.tileElem = tCell;
        }
    }


    /**
     * @override
     */
    public visualBell(): void {
        this.tileElem; // TODO.impl Use an animation to flash tile element?
    }


    /**
     * @override
     */
    public evictOccupant(): void {
        super.evictOccupant();
    }

    /**
     * @override
     */
    public set freeHealth(newHealth: number) {
        super.freeHealth = newHealth;
        if (this.freeHealth) {
            this.tileElem.dataset[WebHooks.Tile.Dataset.HEALTH] = newHealth.toString();
        } else {
            delete this.tileElem.dataset[WebHooks.Tile.Dataset.HEALTH];
        }
    }

    /**
     * @override
     */
    public setLangCharSeqPair(charSeqPair: Lang.CharSeqPair): void {
        super.setLangCharSeqPair(charSeqPair);
        this.langCharElem.innerText = this.langChar;
        this.langSeqElem.innerText  = this.langSeq;
    }

}
// Assert that this extension's constructor has a compatible signature:
VisibleTile as Tile.ClassIf<any>;
Object.freeze(VisibleTile);
Object.freeze(VisibleTile.prototype);
