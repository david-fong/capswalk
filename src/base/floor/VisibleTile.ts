import { Lang as LangTypeDefs, PlayerSkeleton, Player } from "typedefs/TypeDefs";

import { Coord } from "floor/Coord";
import { Tile } from "./Tile";


/**
 * Implicitly handles visuals with help from CSS.
 * 
 * Layers:
 * 0. Invisible cell layer (opaque on visual bell)
 * 1. Empty layer for spotlight mask
 * 2. Player face layer
 * 3. Language Written Character
 * 4. Language Typable Sequence
 * 
 * Dataset:
 * Top-level layer has property "scoreValue"
 * 
 * @extends Tile
 */
export class VisibleTile<B extends Coord.Bare.Impl> extends Tile<B> {

    public  readonly tileCellElem:      HTMLTableCellElement;
    private readonly playerDivElem:     HTMLDivElement;
    private readonly langCharDivElem:   HTMLDivElement;
    private readonly langSeqDivElem:    HTMLDivElement;

    public constructor(pos: B) {
        super(pos);

        const tCell: HTMLTableCellElement = new HTMLTableCellElement();
        {
            tCell.className = VisibleTile.ClassHooks.TILE;
            {
                const pDiv: HTMLDivElement = new HTMLDivElement();
                pDiv.className = VisibleTile.ClassHooks.PLAYER;
                tCell.appendChild(pDiv);
                this.playerDivElem = pDiv;
            } {
                const cDiv: HTMLDivElement = new HTMLDivElement();
                cDiv.className = VisibleTile.ClassHooks.LANG_CHAR;
                tCell.appendChild(cDiv);
                this.langCharDivElem = cDiv;
            } {
                const sDiv: HTMLDivElement = new HTMLDivElement();
                sDiv.className = VisibleTile.ClassHooks.LANG_SEQ;
                tCell.appendChild(sDiv);
                this.langSeqDivElem = sDiv;
            }
        }
        this.tileCellElem = tCell;
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
    public setOccupant(playerDesc: PlayerSkeleton.VisibleState): void {
        super.setOccupant(playerDesc);
        // TODO: set some dataset thing to make player face layer visible.
        if (playerDesc.idNumber === Player.Id.NULL) {
            // Eviction-type action:
            ;
        } else {
            // Inhabitation-type action:
            ;
        }
    }

    /**
     * @override
     */
    public set scoreValue(score: number) {
        this._scoreValue = score;
        this.tileCellElem.dataset[VisibleTile.DataSetHooks.SCORE_VALUE] = score.toString();
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



export namespace VisibleTile {

    /**
     * Must be matched exactly in the CSS.
     */
    export const ClassHooks = Object.freeze(<const>{
        TILE:       <const>"tile",
        PLAYER:     <const>"tile__player",
        LANG_CHAR:  <const>"tile__char",
        LANG_SEQ:   <const>"tile__seq",
    });

    export const DataSetHooks = Object.freeze(<const>{
        SCORE_VALUE: <const>"scoreValue",
    });

}
