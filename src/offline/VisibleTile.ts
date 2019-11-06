
/**
 * 
 * Layers:
 * 0. Invisible cell layer (opaque on visual bell)
 * 1. Empty layer for spotlight mask
 * 2. Player face layer
 * 3. Language Written Character
 * 4. Language Typable Sequence
 * 
 * @extends Tile
 */
class VisibleTile extends Tile {

    private _occupantId: number;

    public  readonly tileTableCellElem: HTMLTableCellElement;
    private readonly playerDivElem:     HTMLDivElement;
    private readonly langCharDivElem:   HTMLDivElement;
    private readonly langSeqDivElem:    HTMLDivElement;

    public constructor(x: number, y: number) {
        super(x, y);
    }

    /**
     * @override
     */
    public visualBell(): void {
        ; // TODO
    }



    public get occupantId(): number {
        return this._occupantId;
    }

    public set occupantId(occupantId: number) {
        // TODO: set some dataset thing to make player face layer visible.
        if (occupantId === null) {
            ;
        } else {
            ;
        }
        this._occupantId = occupantId;
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
