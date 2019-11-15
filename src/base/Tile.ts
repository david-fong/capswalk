import { LangSeq, LangChar, LangCharSeqPair } from "src/Lang";
import { Pos } from "src/Pos";
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
     * 
     * @param x - The horizontal coordinate of this `Tile` in its host {@link Grid}.
     * @param y - The   vertical coordinate of this `Tile` in its host {@link Grid}.
     * 
     * @throws `TypeError` if `x` or `y` are not integer values.
     */
    public constructor(x: number, y: number) {
        this.pos = new Pos(x, y);
        if (!(this.pos.equals(this.pos.round()))) {
            throw new TypeError("Tile position coordinates must be integers.");
        }
        this.reset();
    }

    public reset(): void {
        this.evictOccupant();
        this.numTimesOccupied = 1;
        this.scoreValue = 0;
        this.setLangCharSeq(new LangCharSeqPair(null, null));
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
        return this.occupantId === null;
    }

    public evictOccupant(): void {
        this.occupantId = null;
    }

    public abstract get occupantId(): number | null;

    public abstract set occupantId(occupantId: number | null);

    public abstract get scoreValue(): number;

    public abstract set scoreValue(score: number);

    public abstract setLangCharSeq(charSeqPair: LangCharSeqPair): void;

    public abstract get langChar(): LangChar;

    public abstract get langSeq(): LangSeq;

}
