
/**
 * 
 * 
 * As an implementation choice, `Tile`s are dumb. That is, they have
 * no knowledge of their context. Their internals are all managed by
 * their host `Game` object through method calls.
 */
abstract class Tile {

    readonly pos: Pos;
    public occupantId: number;
    public scoreValue: number;

    /**
     * 
     * @param x The horizontal coordinate of this `Tile` in its host `Grid`.
     * @param y The   vertical coordinate of this `Tile` in its host `Grid`.
     * 
     * @throws `TypeError` if `x` or `y` are not integer values.
     */
    public constructor(x: number, y: number) {
        this.pos = new Pos(x, y);
        if (!(this.pos.equals(this.pos.round()))) {
            throw new TypeError("Tile position coordinates must be integers.");
        }
    }

    public reset(): void {
        this.occupantId = null;
        this.scoreValue = 0;
        this.setLangCharSeq(null, null);
    }



    /**
     * Called, for example, when a `Player` on this `Tile` provides
     * input that did not work to complete their `seqBuffer` against
     * any neighbouring `Tile`s.
     */
    public visualBell(): void {
        // nothing.
    }



    public isOccupied(): boolean {
        return this.occupantId === null;
    }

    public abstract setLangCharSeq(char: LangChar, seq: LangSeq): void;

    public abstract get langChar(): LangChar;

    public abstract get langSeq(): LangSeq;

}
