
/**
 * 
 * 
 * @extends Tile
 */
class ServerTile extends Tile {

    protected _langChar: LangChar;
    protected _langSeq:  LangSeq;

    public setLangCharSeq(char: LangChar, seq: LangSeq): void {
        this._langChar = char;
        this._langSeq  = seq;
    }

    public get langChar(): LangChar {
        return this._langChar;
    }

    public get langSeq(): LangSeq {
        return this._langSeq;
    }

}
