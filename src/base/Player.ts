import { Pos, Tile } from "src/base/Tile";
import { VisibleTile } from "src/offline/VisibleTile";
import { Game } from "src/base/Game";
import { ClientGame } from "src/client/ClientGame";
import { PlayerMovementEvent } from "src/base/PlayerMovementEvent";


/**
 * An **integer value** used to uniquely identify `Player`s in the
 * same {@link Game} together. Strictly negative values correspond to
 * {@link ArtificialPlayer}s, strictly positive values correspond to
 * {@link HumanPlayer}s, and the value `zero` is reserved to indicate
 * that a {@link Tile} is unoccupied.
 */
export type PlayerId = number;

export type PlayerGeneratedRequest = {

    readonly playerId: PlayerId,

    /**
     * ### Client Request
     * 
     * Requester sends this desc to the Game Manager with a value of
     * the ID of the last request it that the server _accepted_. This
     * naturally implies that a requester cannot send a new request to
     * the Game Manager until it has received the Game Manager's
     * response to the last request it made.
     * 
     * ### Server Response
     * 
     * If the server accepts the request, it must broadcast a response
     * with this field set to the incremented value.
     * 
     * If it rejects this request, it must directly acknowledge its
     * receipt of the request (no need to broadcast to all clients)
     * with this field unchanged, which indicates a rejection of the
     * request.
     * 
     * ### Handling Unexpected Values
     * 
     * If the server / Game Manager receives a request with a value in
     * this field lower than the one it set in its last response to the
     * requester, this would mean that the requester didn't wait for a
     * response to its previous request, which it is not supposed to do.
     * 
     * **Important:** If the above requirement is ever changed, (in
     * addition to other mechanisms I haven't reasoned through,) this
     * field's spec should change to require _all_ server responses to
     * have this field set to an incremented value, including rejects.
     * 
     * The server should never receive a request with a value higher
     * than the one it provided in its last response to this requester
     * because it in charge of incrementing it- the client should only
     * change the value it sees to match the one from the server's
     * response.
     * 
     * In both these cases, the server may throw an assertion error for
     * debugging purposes.
     */
    lastAcceptedRequestId: number,
};


/**
 * Made to abstract all operations that change the {@link Player#hostTile}
 * field. Enforces / exposes the {@link PlayerSkeleton#moveTo} method as
 * the interface to any such operations. Also bootstraps the `benchTile`
 * field as a {@link Tile} reserved for this {@link Player}, and the one
 * it occupies after a reset operation.
 */
class PlayerSkeleton {

    /**
     * The game object that this player belongs to.
     */
    public readonly game: Game;

    /**
     * @see PlayerId
     */
    public readonly idNumber: PlayerId;

    private _hostTile: Tile;

    /**
     * A {@link Tile} that can only be occupied by this `Player`.
     */
    public readonly benchTile: Tile;



    protected constructor(game: Game, idNumber: PlayerId) {
        this.game = game;
        this.idNumber = idNumber;
        this.benchTile = new VisibleTile(Player.BENCH_POS);
    }

    /**
     * Automatically benches this `Player`.
     * 
     * Must be called _after_ the {@link Grid} has been reset.
     */
    protected reset(): void {
        this.benchTile.reset();
        this.benchTile.setLangCharSeq({
            // These values are not functional.
            char: this.idNumber.toString(),
            seq:  this.idNumber.toString(),
        });
        this._hostTile = this.benchTile;
        this.benchTile.occupantId = this.idNumber;
    }

    protected get hostTile(): Tile {
        return this._hostTile;
    }

    /**
     * Evicts this `Player` from its last known position (which may be
     * lagging behind the state of the master copy of the game.
     * 
     * @param dest - 
     */
    public moveTo(dest: Tile): void {

        // Evict self from current `Tile`.
        if (this.hostTile.occupantId !== this.idNumber) {
            if (!(this.game instanceof ClientGame)) {
                // Should never happen.
                throw new Error("Linkage between player and occupied tile disagrees.");
            }
            // Otherwise, this corner case is guaranteed to follow the events
            // described in the below comment: at this `ClientGame`, `p2` will
            // move off of the `Tile` currently occupied by this `Player`.
        } else {
            // Move off of current host `Tile`:
            this._hostTile.evictOccupant();
        }

        // Occupy the destination `Tile.
        if (dest.isOccupied()) {
            if (!(this.game instanceof ClientGame)) {
                // Should never happen because the Game Manager
                // rejects requests to move onto an occupied `Tile`.
                throw new Error("Only one player can occupy a tile at a time.");
            }
            // Otherwise, this is actually possible in a variant of the _DAS_
            // where another `Player` `p2` moves to `B`, I receive that update,
            // then `p2` makes a request to move to `C`, which the Game Manager
            // accepts and begins to notify my `ClientGame` of, but between the
            // time that the GM accepts the request and when I receive the update,
            // I make a request to move to `B`, which gets accepted by the GM,
            // and because I might not be using websockets as my underlying
            // transport, I receive the update for my own request first, which
            // would appear to my `ClientGame` as if I was moving onto the `Tile`
            // occupied by `p2`.
        } else {
            // Move to occupy the destination `Tile`:
            this._hostTile = dest;
            dest.occupantId = this.idNumber;
        }
    }
}





/**
 * 
 */
export abstract class Player extends PlayerSkeleton {

    public static readonly BENCH_POS: Pos = new Pos(Infinity, Infinity);

    /**
     * This should never be accessed directly. Use accessors instead.
     */
    protected _isDowned: boolean;

    /**
     * This should never be accessed directly. Use accessors instead.
     */
    protected _score: number;

    /**
     * This should never be accessed directly. Use accessors instead.
     */
    protected _stockpile: number;

    /**
     * This should never be accessed directly. Use accessors instead.
     */
    protected _isBubbling: boolean;

    /**
     * Managed externally by the Game Manager. Here for composition.
     */
    public bubbleTimer: number | NodeJS.Timeout;

    public lastAcceptedRequestId: number;

    public requestInFlight: boolean;



    public constructor(game: Game, idNumber: PlayerId) {
        super(game, idNumber);
        if (Math.trunc(this.idNumber) !== this.idNumber) {
            throw new RangeError("Player ID's must be integer values.");
        }
    }

    public reset(): void {
        super.reset();
        this.isDowned   = false;
        this.score      = 0;
        this.stockpile  = 0;
        this.isBubbling = false;
        this.game.cancelTimeout(this.bubbleTimer);
        this.bubbleTimer = undefined;
        this.lastAcceptedRequestId = PlayerMovementEvent.INITIAL_REQUEST_ID;
        this.requestInFlight = false;
    }



    /**
     * Called automatically by {@link HumanPlayer#seqBufferAcceptKey}
     * for {@link HumanPlayer}s, and by a periodic callback for
     * {@link ArtificialPlayer}s.
     * 
     * @param dest - 
     */
    protected makeMovementRequest(dest: Tile): void {
        if (this.requestInFlight) {
            throw new Error("Only one request should ever be in flight at a time.");
        }
        this.requestInFlight = true;
        this.abstractMakeMovementRequest(dest);
    }

    /**
     * Sends a descriptor of the movement request to the Game Manager.
     * 
     * **_Do not call this directly!_** Instead, make a call to the
     * {@link Player#makeMovementRequest} method, which calls this,
     * and performs relevant non-implementation-dependant operations
     * such as book-keeping for spam control.
     * 
     * Request should call functions with a flow that either short-
     * circuits, or terminates with a call to {@link Player#moveTo}.
     * 
     * @param dest - 
     * 
     * @throws `Error` if `dest` is occupied by another `Player`.
     */
    protected abstract abstractMakeMovementRequest(dest: Tile): void;

    public bench(): void {
        this.makeMovementRequest(this.benchTile);
    }



    public get pos(): Pos {
        return this.hostTile.pos;
    }

    public get isDowned(): boolean {
        return this._isDowned;
    }

    public set isDowned(isDowned: boolean) {
        this._isDowned = isDowned;
    }

    public get score(): number {
        return this._score;
    }

    public set score(newValue: number) {
        this._score = newValue;
    }

    public get stockpile(): number {
        return this._stockpile;
    }

    public set stockpile(stockpile: number) {
        this._stockpile = stockpile;
    }

    public get isBubbling(): boolean {
        return this._isBubbling;
    }

    public set isBubbling(isBubbling: boolean) {
        this._isBubbling = isBubbling;
    }

    public getUNT(): Array<Tile> {
        return this.game.getUNT(this.pos);
    }

}
