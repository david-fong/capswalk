import { OmHooks } from "../../browser/OmHooks";
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
    private readonly langCharElem:  HTMLDivElement;
    private readonly langSeqElem:   HTMLDivElement;

    public constructor(coordDesc: Tile<S>["coord"]) {
        super(coordDesc);
        {
            const baseElem = document.createElement("div");
            baseElem.classList.add(OmHooks.Tile.Class.BASE);
            this.#baseElem = baseElem;
        } {
            // Must be the first child. See note in CSS class hook.
            const pthbElem = document.createElement("div");
            pthbElem.classList.add(OmHooks.Tile.Class.POINTER_HB);
            this.#baseElem.appendChild(pthbElem);
        } {
            const charElem = document.createElement("div");
            charElem.classList.add(
                OmHooks.Tile.Class.LANG_CHAR,
                OmHooks.General.Class.FILL_PARENT,
            );
            this.#baseElem.appendChild(charElem);
            this.langCharElem = charElem;
        } {
            const seqElem = document.createElement("div");
            seqElem.classList.add(OmHooks.Tile.Class.LANG_SEQ);
            this.#baseElem.appendChild(seqElem);
            this.langSeqElem = seqElem;
        }
    }

    public __addToDom(parent: HTMLElement): void {
        parent.appendChild(this.#baseElem);
    }

    public setOccupant(playerId: Player.Id, playerElem: HTMLElement): void {
        super.setOccupant(playerId, playerElem);
        this.#baseElem.appendChild(playerElem)
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
            this.#baseElem.dataset[OmHooks.Tile.Dataset.HEALTH] = newHealth.toString();
        } else {
            delete this.#baseElem.dataset[OmHooks.Tile.Dataset.HEALTH];
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
