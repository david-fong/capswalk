import { OmHooks } from "defs/OmHooks";
import type { Lang, Player } from "defs/TypeDefs";

import { Coord, Tile } from "./Tile";

export { Coord } from "./Tile";


/**
 * Implicitly handles visuals with help from CSS.
 */
export class VisibleTile<S extends Coord.System> extends Tile<S> {

    readonly #baseElem:             HTMLDivElement;
    private readonly langCharElem:  HTMLDivElement;
    private readonly langSeqElem:   HTMLDivElement;

    public constructor(coordDesc: Tile<S>["coord"]) {
        super(coordDesc);
        {
            const baseElem
                = this.#baseElem
                = document.createElement("div");
            baseElem.classList.add(
                OmHooks.General.Class.CENTER_CONTENTS,
                OmHooks.General.Class.STACK_CONTENTS,
                OmHooks.Tile.Class.BASE,
            );
            baseElem.setAttribute("aria-label", "Tile");
        } {
            // Pointer hitbox element.
            // Must be the first child. See note in CSS class hook.
            const pthb = document.createElement("div");
            pthb.classList.add(OmHooks.Tile.Class.POINTER_HB);
            pthb.setAttribute("aria-hidden", "true");
            this.#baseElem.appendChild(pthb);
        } {
            const charElem
                = this.langCharElem
                = document.createElement("div");
            charElem.classList.add(
                OmHooks.Tile.Class.LANG_CHAR,
            );
            this.#baseElem.appendChild(charElem);
        } {
            const seqElem
                = this.langSeqElem
                = document.createElement("div");
            seqElem.classList.add(OmHooks.Tile.Class.LANG_SEQ);
            seqElem.setAttribute("role", "tooltip");
            this.#baseElem.appendChild(seqElem);
        }
    }

    public __addToDom(parent: HTMLElement): void {
        parent.appendChild(this.#baseElem);
    }

    /**
     * @override
     */
    public __setOccupant(
        playerId: Player.Id,
        immigrantInfo: Tile.VisibleImmigrantInfo,
    ): void {
        super.__setOccupant(playerId, immigrantInfo);
        // It must go at least before the langChar element so that the
        // CSS can create a fading trail effect. It must go after the
        // hitbox so that it can be hidden to avoid covering the tooltip.
        this.#baseElem.insertBefore(immigrantInfo.playerElem, this.langCharElem);
        this.langSeqElem.innerText = immigrantInfo.username;
    }


    /**
     * @override
     */
    public evictOccupant(): void {
        super.evictOccupant();
        // Undo setting mouseover text to something player-related
        // (See `__setOccupant` for what we did and now need to undo):
        this.langSeqElem.innerText = this.langSeq;
    }

    /**
     * @override
     */
    public set freeHealth(newFreeHealth: Player.Health) {
        super.freeHealth = newFreeHealth;
        if (this.freeHealth > 0) {
            this.#baseElem.dataset[OmHooks.Tile.Dataset.HEALTH] = this.freeHealth.toString();
        } else {
            delete this.#baseElem.dataset[OmHooks.Tile.Dataset.HEALTH];
        }
    }

    /**
     * @override
     */
    // NOTE: For some reason, if we override the setter, the transpiled
    // code does not link to the super implementation... Or maybe this
    // is just a property of plain ECMA javascript??
    public get freeHealth(): Player.Health {
        return super.freeHealth;
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
