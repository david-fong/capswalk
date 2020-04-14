import { Lang, Player } from "utils/TypeDefs";
import { Coord } from "./Coord";
export { Coord };


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
 */
export class Tile<S extends Coord.System> {

    public readonly coord: Coord<S>;
    #occupantId: Player.Id.Nullable;
    #freeHealth: Player.Health;
    #langChar:  Lang.Char;
    #langSeq:   Lang.Seq;

    /**
     * The number of times this `Tile` was occupied since the last
     * reset. This is used to ensure that in online sessions, each
     * client has a synchronized copy of the game. The Game Manager
     * will drop requests for movements made by players who made the
     * request at a time when they had not yet received information
     * related to the game-state in affected-zones of their request.
     */
    public lastKnownUpdateId: number;

    /**
     * _Does not call reset._
     *
     * @param coord -
     */
    public constructor(coord: Coord<S>) {
        this.coord = coord;
        this.#occupantId = Player.Id.NULL;
    }

    public reset(): void {
        this.evictOccupant();
        this.lastKnownUpdateId = 0;
        this.freeHealth = 0;

        // This is also done when shuffling individual tiles throughout
        // the game, but it is done here since initially, nothing needs
        // to be avoided because no CSP's have been set yet.
        this.setLangCharSeqPair(Lang.CharSeqPair.NULL);
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
     * @param playerId -
     */
    public setOccupant(playerId: Player.Id): void {
        this.#occupantId = playerId;
    }

    public get isOccupied(): boolean {
        return this.occupantId !== Player.Id.NULL;
    }

    public evictOccupant(): void {
        this.#occupantId = Player.Id.NULL;
    }

    public get occupantId(): Player.Id.Nullable {
        return this.#occupantId;
    }



    public get freeHealth(): Player.Health {
        return this.#freeHealth;
    }

    public set freeHealth(score: Player.Health) {
        this.#freeHealth = score;
    }

    /**
     * @override
     */
    public setLangCharSeqPair(charSeqPair: Lang.CharSeqPair): void {
        this.#langChar = charSeqPair.char;
        this.#langSeq  = charSeqPair.seq;
    }

    public get langChar(): Lang.Char {
        return this.#langChar;
    }

    public get langSeq(): Lang.Seq {
        return this.#langSeq;
    }

}
// If this errs when changing the constructor signature, then
// the type definition being asserted should be updated to match.
Tile as Tile.ClassIf<any>;



export namespace Tile {

    // NOTE: We need this for type-safety because just using typeof
    // will not capture information about type arguments.
    export type ClassIf<S extends Coord.System> = {
        new(coord: Tile<S>["coord"]): Tile<S>;
    };

}
Object.freeze(Tile);
Object.freeze(Tile.prototype);
