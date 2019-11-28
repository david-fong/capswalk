import { LangSeq, LangChar, LangCharSeqPair, EMPTY_CSP } from "src/Lang";
import { Pos, BarePos } from "src/Pos";
import { PlayerId } from "src/base/Player";

export { Pos, BarePos } from "src/Pos";

/**
 * 
 * 
 * As an implementation choice, `Tile`s are dumb. That is, they have
 * no knowledge of their context. Their internals are all managed by
 * their host {@link Game} object through method calls.
 */
export abstract class Tile {

    public readonly pos: Pos;

    protected _occupantId: PlayerId;
    protected _scoreValue: number;

    protected _langChar: LangChar;
    protected _langSeq:  LangSeq;

    /**
     * The number of times this `Tile` was occupied since the last
     * reset. This is used to ensure that in online sessions, each
     * client has a synchronized copy of the game. The Game Manager
     * will drop requests for movements made by players who made the
     * request at a time when they had not yet received information
     * related to the game-state in affected-zones of their request.
     * 
     * TODO: should there be another such counter for scoreValue updates?
     */
    public numTimesOccupied: number;

    /**
     * _Does not call reset._
     * 
     * @param pos - 
     * @throws `TypeError` if `x` or `y` are not integer values.
     */
    public constructor(pos: BarePos) {
        this.pos = Pos.ofBarePos(pos);
        if (!(this.pos.equals(this.pos.round()))) {
            throw new TypeError("Tile position coordinates must be integers.");
        }
    }

    public reset(): void {
        this.evictOccupant();
        this.numTimesOccupied = 1;
        this.scoreValue = 0;
        this.setLangCharSeq(EMPTY_CSP);
    }



    /**
     * Called, for example, when a {@link Player} on this `Tile` provides
     * input that did not work to complete their {@link Player#seqBuffer}
     * against any neighbouring `Tile`s.
     */
    public visualBell(): void {
        // does nothing by default.
    }



    public isOccupied(): boolean {
        return this.occupantId !== 0;
    }

    public evictOccupant(): void {
        this.occupantId = null;
    }

    public get occupantId(): PlayerId {
        return this._occupantId;
    }

    public set occupantId(occupantId: PlayerId) {
        this._occupantId = occupantId;
    }



    public get scoreValue(): number {
        return this._scoreValue;
    }

    public set scoreValue(score: number) {
        this._scoreValue = score;
    }




    /**
     * @param charSeqPair - May be undefined. If so, no changes take place.
     */
    public setLangCharSeq(charSeqPair: LangCharSeqPair): void {
        if (charSeqPair) {
            this._langChar = charSeqPair.char;
            this._langSeq  = charSeqPair.seq;
        }
    }

    public get langChar(): LangChar {
        return this._langChar;
    }

    public get langSeq(): LangSeq {
        return this._langSeq;
    }

}
