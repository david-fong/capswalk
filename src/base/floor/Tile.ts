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
 * 
 * @template S
 * The coordinate system enum for this tile's coordinate.
 * 
 * @template O
 * The id of the only player allowed to occupy this tile, or the value
 * Player.Id.NULL, indicating that any player may occupy this tile.
 */
// TODO: change O to have enum with entries GRID and BENCH. using
//  their player id doesn't work because you can't make a type that
//  is numbers excluding certain numbers.
export class Tile<S extends Coord.System, O extends Player.Id> {

    public readonly coord: O extends typeof Player.Id.NULL ? Coord<S> : typeof Coord.BENCH;
    public readonly designatedOccupant: O;
    protected _occupantId: O extends typeof Player.Id.NULL
        ? Player.Id // Any player can occupy this tile.
        : O | typeof Player.Id.NULL;

    protected _langChar: Lang.Char;
    protected _langSeq:  Lang.Seq;
    protected _scoreValue: number;

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
     * @param designatedOccupant - See the documentation for the type parameter, `O`.
     */
    public constructor(coord: Tile<S,O>["coord"], designatedOccupant: O) {
        this.coord = coord;
        this.designatedOccupant = designatedOccupant;
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
        if (this._occupantId !== Player.Id.NULL && playerDesc.idNumber !== this.designatedOccupant) {
            throw new RangeError(`Only the player with the player ID`
                + ` \"${this.designatedOccupant}\" may occupy this tile.`);
        }
        this._occupantId = playerDesc.idNumber as Tile<S,O>["_occupantId"];
    }

    public get isOccupied(): boolean {
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
// If this errs when changing the constructor signature, then
// the type definition being asserted should be updated to match.
Tile as Tile.ConstructorType<any, any>;



export namespace Tile {

    export type ConstructorType<S extends Coord.System, P extends Player.Id> = {
        new(coord: Tile<S,P>["coord"], designatedOccupant: P): Tile<S,P>;
    };

}
