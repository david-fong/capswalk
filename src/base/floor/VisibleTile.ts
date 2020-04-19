import { WebHooks } from "../../browser/WebHooks";
import type { Lang, Player } from "utils/TypeDefs";

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

    readonly #baseElem:     HTMLElement;
    readonly #innerBase:    HTMLElement;
    private readonly langCharElem:  HTMLDivElement;
    private readonly langSeqElem:   HTMLDivElement;

    public constructor(coordDesc: Tile<S>["coord"]) {
        super(coordDesc);
        {
            const innerBase = document.createElement("div");
            innerBase.className = WebHooks.Tile.Class.UNSHIFT_HB;
            {
                const cDiv = document.createElement("div");
                cDiv.className = WebHooks.Tile.Class.LANG_CHAR;
                cDiv.classList.add(WebHooks.General.Class.FILL_PARENT);
                innerBase.appendChild(cDiv);
                this.langCharElem = cDiv;
            } {
                const sDiv = document.createElement("div");
                sDiv.className = WebHooks.Tile.Class.LANG_SEQ;
                innerBase.appendChild(sDiv);
                this.langSeqElem = sDiv;
            }
            const tCell = document.createElement("div");
            tCell.className = WebHooks.Tile.Class.BASE;
            tCell.appendChild(innerBase);
            this.#innerBase = innerBase
            this.#baseElem = tCell;
        }
    }

    public __addToDom(parent: HTMLElement): void {
        parent.appendChild(this.#baseElem);
    }

    public setOccupant(playerId: Player.Id, playerElem: HTMLElement): void {
        super.setOccupant(playerId, playerElem);
        this.#innerBase.appendChild(playerElem)
    }


    /**
     * @override
     */
    public visualBell(): void {
        this.#baseElem; // TODO.impl Use an animation to flash tile element?
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
            this.#baseElem.dataset[WebHooks.Tile.Dataset.HEALTH] = newHealth.toString();
        } else {
            delete this.#baseElem.dataset[WebHooks.Tile.Dataset.HEALTH];
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
