import { Lang, PlayerSkeleton, Player } from "typedefs/TypeDefs";

import { Coord } from "./Coord";

export { Coord } from "./Coord";


/**
 * 
 * 
 * As an implementation choice, `Tile`s are dumb. That is, they have
 * no knowledge of their context. Their internals are all managed by
 * their host {@link Game} object through method calls.
 */
export class Tile<
    S extends Coord.System,
    B extends typeof Coord.BareImpl[S] = typeof Coord.BareImpl[S],
> {

    public readonly pos: Coord<S>;

    protected _occupantId: Player.Id;
    protected _scoreValue: number;

    protected _langChar: Lang.Char;
    protected _langSeq:  Lang.Seq;

    /**
     * The number of times this `Tile` was occupied since the last
     * reset. This is used to ensure that in online sessions, each
     * client has a synchronized copy of the game. The Game Manager
     * will drop requests for movements made by players who made the
     * request at a time when they had not yet received information
     * related to the game-state in affected-zones of their request.
     */
    public numTimesOccupied: number;

    /**
     * _Does not call reset._
     * 
     * @param coordSys -
     * @param coordDesc - 
     * @throws `TypeError` if `x` or `y` are not integer values.
     */
    public constructor(coordSys: S, coordDesc: B) {
        this.pos = Coord.Constructors[coordSys](coordDesc);
        if (!(this.pos.equals(this.pos.round()))) {
            throw new TypeError("Tile position coordinates must be integers.");
        }
    }

    public reset(): void {
        this.evictOccupant();
        this.numTimesOccupied = 1;
        this.scoreValue = 0;

        // Note that this is also redone done as part of the game's
        // reset sequence when shuffling tiles. This also done here
        // because all `charSeqPair`s in tiles must be cleared before
        // shuffling since initially, nothing needs to be avoided.
        this.setLangCharSeq(Lang.CharSeqPair.NULL);
    }



    /**
     * Called, for example, when a {@link Player} on this `Tile` provides
     * input that did not work to complete their {@link Player#seqBuffer}
     * against any neighbouring `Tile`s.
     */
    public visualBell(): void {
        // does nothing by default.
    }



    /**
     * Any overrides must make a supercall to this implementation.
     * 
     * @param playerDesc - 
     */
    public setOccupant(playerDesc: PlayerSkeleton.VisibleState): void {
        this._occupantId = playerDesc.idNumber;
    }

    public isOccupied(): boolean {
        return this.occupantId !== Player.Id.NULL;
    }

    public evictOccupant(): void {
        this.setOccupant(PlayerSkeleton.VisibleState.NULL);
    }

    public get occupantId(): Player.Id {
        return this._occupantId;
    }



    public get scoreValue(): number {
        return this._scoreValue;
    }

    public set scoreValue(score: number) {
        this._scoreValue = score;
    }




    /**
     * @override
     */
    public setLangCharSeq(charSeqPair: Lang.CharSeqPair): void {
        this._langChar = charSeqPair.char;
        this._langSeq  = charSeqPair.seq;
    }

    public get langChar(): Lang.Char {
        return this._langChar;
    }

    public get langSeq(): Lang.Seq {
        return this._langSeq;
    }

}
