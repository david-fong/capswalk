import { LangChar, LangSeq, LangCharSeqPair } from "src/Lang";
import { Tile } from "src/base/Tile";


/**
 * Must be matched exactly in the CSS.
 */
class ClassHooks {
    public static readonly TILE: string         = <const>"tile";
    public static readonly PLAYER: string       = <const>"tile__player";
    public static readonly LANG_CHAR: string    = <const>"tile__char";
    public static readonly LANG_SEQ: string     = <const>"tile__seq";
}

class DataSetHooks {
    public static readonly SCORE_VALUE: string  = <const>"scoreValue";
}

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
    //public static readonly CLASS_HOOKS: object = ClassHooks;

    private _occupantId: number | null;

    public  readonly tileCellElem:      HTMLTableCellElement;
    private readonly playerDivElem:     HTMLDivElement;
    private readonly langCharDivElem:   HTMLDivElement;
    private readonly langSeqDivElem:    HTMLDivElement;

    public constructor(x: number, y: number) {
        super(x, y);

        const tCell: HTMLTableCellElement = new HTMLTableCellElement();
        {
            tCell.className = ClassHooks.TILE;
            {
                const pDiv: HTMLDivElement = new HTMLDivElement();
                pDiv.className = ClassHooks.PLAYER;
                tCell.appendChild(pDiv);
                this.playerDivElem = pDiv;
            } {
                const cDiv: HTMLDivElement = new HTMLDivElement();
                cDiv.className = ClassHooks.LANG_CHAR;
                tCell.appendChild(cDiv);
                this.langCharDivElem = cDiv;
            } {
                const sDiv: HTMLDivElement = new HTMLDivElement();
                sDiv.className = ClassHooks.LANG_SEQ;
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



    public get occupantId(): number | null {
        return this._occupantId;
    }

    public set occupantId(occupantId: number | null) {
        // TODO: set some dataset thing to make player face layer visible.
        if (occupantId === null) {
            ;
        } else {
            ;
        }
        this._occupantId = occupantId;
    }

    public get scoreValue(): number {
        return Number.parseInt(this.tileCellElem.dataset[DataSetHooks.SCORE_VALUE]);
    }

    public set scoreValue(score: number) {
        this.tileCellElem.dataset[DataSetHooks.SCORE_VALUE] = score.toString();
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
