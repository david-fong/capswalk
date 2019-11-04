
/**
 * 
 * 
 * @extends Tile
 */
class ServerTile extends Tile {

    private _occupantId: number;

    protected _langChar: LangChar;
    protected _langSeq:  LangSeq;



    public get occupantId(): number {
        return this._occupantId;
    }

    public set occupantId(occupantId: number) {
        this._occupantId = occupantId;
    }

    public setLangCharSeq(charSeqPair: LangCharSeqPair): void {
        this._langChar = charSeqPair.char;
        this._langSeq  = charSeqPair.seq;
    }

    public get langChar(): LangChar {
        return this._langChar;
    }

    public get langSeq(): LangSeq {
        return this._langSeq;
    }

}
