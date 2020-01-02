import { Lang, PlayerSkeleton, Player } from "utils/TypeDefs";

import { Coord } from "./Coord";

export { Coord } from "./Coord";


/**
 * # The Tile Class
 * 
 * As an implementation choice, tiles are dumb. That is, they have
 * no knowledge of their context. Their internals are all managed by
 * their host {@link Game} through method calls.
 * 
 * From a caller's point of view, extending classes should have am
 * identical constructor signature as that of this base class. This
 * can be done by a type assertion statement: `<extension class> as
 * Tile.ConstructorType<any>`.
 */
export class Tile<S extends Coord.System> {

    public readonly coord: Coord<S>; // TODO: change this to allow the bench string.

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
     * @param coord - 
     * @throws `TypeError` if `x` or `y` are not integer values.
     */
    public constructor(coord: Coord<S>) {
        this.coord = coord;
    }

    public reset(): void {
        this.evictOccupant();
        this.numTimesOccupied = 0;
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
// If this errs, then the type alias must be updated.
Tile as Tile.ConstructorType<any>;



export namespace Tile {

    export type ConstructorType<S extends Coord.System> = {
        new(coord: Coord<S>): Tile<S>;

        /**
         * Create a Tile for use as a player's bench. The coordinate
         * specifier field for the returned instance must equal the
         * special string constant reserved to denote a player's bench.
         * 
         * Note: Because of namespace merging and how extension-class
         * literals inherit static-type fields of their parent, unless
         * this is redefined in a child class, that child class will
         * inherit the first implementation defined by their parents.
         */
        createBench(): Tile<S>;
    };

    export const createBench = <S extends Coord.System>(): Tile<S> => {
        return new BenchImpl();
    };

    class BenchImpl<S extends Coord.System> extends Tile<S> {
        public constructor() {
            super(Coord.BENCH);
        }
    }
}
