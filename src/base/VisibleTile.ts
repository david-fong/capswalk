import { Lang } from "src/lang/Lang";
import { Tile, BarePos } from "src/base/Tile";
import { PlayerSkeleton, Player } from "src/base/player/Player";


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
export class VisibleTile extends Tile {

    public  readonly tileCellElem:      HTMLTableCellElement;
    private readonly playerDivElem:     HTMLDivElement;
    private readonly langCharDivElem:   HTMLDivElement;
    private readonly langSeqDivElem:    HTMLDivElement;

    public constructor(pos: BarePos) {
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

    public set scoreValue(score: number) {
        this._scoreValue = score;
        this.tileCellElem.dataset[VisibleTile.DataSetHooks.SCORE_VALUE] = score.toString();
    }

    public setLangCharSeq(charSeqPair: Lang.CharSeqPair): void {
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
