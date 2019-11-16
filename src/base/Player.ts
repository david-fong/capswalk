import { LangCharSeqPair } from "src/Lang";
import { BarePos, Pos, Tile } from "src/base/Tile";
import { Game } from "src/base/Game";
import { VisibleTile } from "src/offline/VisibleTile";



// TODO: make type PlayerId so it can the center for documentation on
// that topic. should be non-nullable. make zero mean not-a-player.
// use this type in Tile#occupantId as well.

class PlayerSkeleton {

    /**
     * An integer value unique to this `Player` in this {@link Game}.
     * If this `Player` is human-controlled, this value is non-negative,
     * and otherwise, it is negative.
     */
    public readonly idNumber: number;

    private _hostTile: Tile;

    /**
     * A {@link Tile} that can only be occupied by this `Player`.
     */
    public readonly benchTile: Tile;

    protected constructor(idNumber: number) {
        this.idNumber = idNumber;
        this.benchTile = new VisibleTile(Player.BENCH_POS);
    }

    /**
     * Must be called _after_ the {@link Grid} has been reset.
     */
    protected reset(): void {
        this.benchTile.reset();
        this.benchTile.setLangCharSeq({
            char: this.idNumber.toString(),
            seq:  this.idNumber.toString(),
        });
        this.benchTile.occupantId = this.idNumber;
        this._hostTile = this.benchTile;
    }

    protected get hostTile(): Tile {
        return this._hostTile;
    }

    /**
     * This operation should never fail. If two `Player`s attempt to
     * move to move to the same position, since javascript and Node
     * are single-threaded, one request will be handled first, the other
     * will be handled second and "dropped" by the Game Manager: this
     * method will never get called for the dropped request.
     * 
     * If another player makes successful requests entering and leaving
     * some position `A`, and then I make a request to move to A before
     * receiving the changes made as an effect of the other player's
     * movements, the Game Manager will still accept my request: it may
     * happen that I receive the thumbs-up for my action and make those
     * changes before the other player's moves' changes reach my local
     * copy of the game, but this can be (and is) handled gracefully
     * without any destructive or corruptive effects.
     * 
     * @param dest - 
     */
    public moveTo(dest: Tile): void {
        if (this._hostTile.occupantId !== this.idNumber) {
            // should never happen.
            // TODO: but this WILL happen in the below (next assertion) scenario.
            throw new Error("Linkage between player and occupied tile disagrees.");
        } else {
            // Move off of current host `Tile`:
            this._hostTile.evictOccupant();
        }

        if (dest.isOccupied()) {
            // should never happen. enforced by caller.
            /*
            TODO: actually, this can happen:
            - I see other player B_p on adjacent tile B_t
            - Other player's operator 
            */
            throw new Error("Only one player can occupy a tile at a time.");
        }
        // Move to occupy the destination `Tile`:
        this._hostTile = dest;
        dest.occupantId = this.idNumber;

        // TODO: is there more to do?
    }
}



/**
 * 
 */
export abstract class Player extends PlayerSkeleton {

    public static readonly BENCH_POS: Pos = new Pos(Infinity, Infinity);

    /**
     * The game object that this player belongs to.
     */
    public readonly game: Game;

    protected _isAlive: boolean;
    protected _score:   number;

    public constructor(game: Game, idNumber: number) {
        super(idNumber);
        this.game = game;
    }

    public reset(): void {
        super.reset();
        this._isAlive   = true;
        this._score     = 0;
    }



    /**
     * Send a descriptor of the movement request to the Game Manager.
     * Called automatically by {@link HumanPlayer#seqBufferAcceptKey}
     * for {@link HumanPlayer}s, and by a periodic callback for
     * {@link ArtificialPlayer}s.
     * 
     * Request should call functions with a flow that either short-
     * circuits, or terminates with a call to {@link Player#moveTo}.
     * 
     * @param dest - 
     * 
     * @throws `Error` if `dest` is occupied by another `Player`.
     */
    public abstract makeMovementRequest(dest: Tile): void;

    public bench(): void {
        this.makeMovementRequest(this.benchTile);
    }



    public get pos(): Pos {
        return this.hostTile.pos;
    }

    public get score(): number {
        return this._score;
    }

    public set score(newValue: number) {
        this._score = newValue;
    }

    public getUNT(): Array<Tile> {
        return this.game.getUNT(this.pos);
    }

}



/**
 * TODO: add fields for changes to player score
 */
export class PlayerMovementEvent {

    public readonly destPos: BarePos;

    public playerNewScore: number;
    public destNumTimesOccupied: number;
    public newCharSeqPair: LangCharSeqPair | null;

    public constructor(
        public readonly playerId: number,
        destTile: Tile,
    ) {
        this.destPos = destTile.pos;
        this.destNumTimesOccupied = destTile.numTimesOccupied;
    }
}

// TODO create event for arrival / creation of new scoreValues.
