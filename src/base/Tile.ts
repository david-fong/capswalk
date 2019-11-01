
/**
 * 
 * 
 * As an implementation choice, [Tile]s are dumb. That is, they have
 * no knowledge of their context. Their internals are all managed by
 * their host [Game] object through method calls.
 */
abstract class Tile {

    readonly pos: Pos;
    public occupantId: number;
    public scoreValue: number;
    protected _langChar: LangChar;
    protected _langSeq:  LangSeq;


    public constructor(x: number, y: number) {
        this.pos = new Pos(x, y);
        console.assert(this.pos.equals(this.pos.round()));
    }

    public reset(): void {
        this.occupantId = null;
        this.scoreValue = 0;
        this._langChar  = null;
        this._langSeq   = null;
    }



    public abstract visualBell(): void;



    public isOccupied(): boolean {
        return this.occupantId === null;
    }

    public setLangValues(char: LangChar, seq: LangSeq): void {
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
