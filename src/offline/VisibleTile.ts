import { Lang } from "src/lang/Lang";
import { Tile, BarePos } from "src/base/Tile";
import { PlayerId } from "src/base/Player";


/**
 * Must be matched exactly in the CSS.
 */
export const TileClassHooks = Object.freeze(<const>{
    TILE:       <const>"tile",
    PLAYER:     <const>"tile__player",
    LANG_CHAR:  <const>"tile__char",
    LANG_SEQ:   <const>"tile__seq",
});

export const TileDataSetHooks = Object.freeze(<const>{
    SCORE_VALUE: <const>"scoreValue",
});



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

    // TODO: do we need to make the accessible outside?
    // public static readonly CLASS_HOOKS: object = ClassHooks;

    public  readonly tileCellElem:      HTMLTableCellElement;
    private readonly playerDivElem:     HTMLDivElement;
    private readonly langCharDivElem:   HTMLDivElement;
    private readonly langSeqDivElem:    HTMLDivElement;

    public constructor(pos: BarePos) {
        super(pos);

        const tCell: HTMLTableCellElement = new HTMLTableCellElement();
        {
            tCell.className = TileClassHooks.TILE;
            {
                const pDiv: HTMLDivElement = new HTMLDivElement();
                pDiv.className = TileClassHooks.PLAYER;
                tCell.appendChild(pDiv);
                this.playerDivElem = pDiv;
            } {
                const cDiv: HTMLDivElement = new HTMLDivElement();
                cDiv.className = TileClassHooks.LANG_CHAR;
                tCell.appendChild(cDiv);
                this.langCharDivElem = cDiv;
            } {
                const sDiv: HTMLDivElement = new HTMLDivElement();
                sDiv.className = TileClassHooks.LANG_SEQ;
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



    public set occupantId(occupantId: PlayerId) {
        this._occupantId = occupantId;
        // TODO: set some dataset thing to make player face layer visible.
        if (occupantId === 0) {
            // Eviction-type action:
            ;
        } else {
            // Inhabitation-type action:
            ;
        }
    }

    public set scoreValue(score: number) {
        this._scoreValue = score;
        this.tileCellElem.dataset[TileDataSetHooks.SCORE_VALUE] = score.toString();
    }

    public setLangCharSeq(charSeqPair: Lang.CharSeqPair): void {
        super.setLangCharSeq(charSeqPair);
        this.langCharDivElem.innerText = this.langChar;
        this.langSeqDivElem.innerText  = this.langSeq;
    }

}
