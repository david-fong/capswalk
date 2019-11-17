import { LangChar, LangSeq, LangCharSeqPair } from "src/Lang";
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

    private _occupantId: PlayerId;

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



    public get occupantId(): PlayerId {
        return this._occupantId;
    }

    public set occupantId(occupantId: PlayerId) {
        // TODO: set some dataset thing to make player face layer visible.
        if (occupantId === null) {
            ;
        } else {
            ;
        }
        this._occupantId = occupantId;
    }

    public get scoreValue(): number {
        return Number.parseInt(this.tileCellElem.dataset[TileDataSetHooks.SCORE_VALUE]);
    }

    public set scoreValue(score: number) {
        this.tileCellElem.dataset[TileDataSetHooks.SCORE_VALUE] = score.toString();
    }

    public setLangCharSeq(charSeqPair: LangCharSeqPair): void {
        this.langCharDivElem.innerText = charSeqPair.char;
        this.langSeqDivElem.innerText  = charSeqPair.seq;
    }

    public get langChar(): LangChar {
        return this.langCharDivElem.innerText;
    }

    public get langSeq(): LangSeq {
        return this.langSeqDivElem.innerText;
    }

}
