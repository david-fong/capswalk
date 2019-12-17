import { Tile } from "base/Tile";
import { Game } from "base/Game";
import { Player } from "base/player/Player";


/**
 * Made to abstract all operations that change the {@link Player#hostTile}
 * field. Enforces / exposes the {@link PlayerSkeleton#moveTo} method as
 * the interface to any such operations. Also bootstraps the `benchTile`
 * field as a {@link Tile} reserved for this {@link Player}, and the one
 * it occupies after a reset operation.
 */
export class PlayerSkeleton implements PlayerSkeleton.VisibleState {

    /**
     * The game object that this player belongs to.
     */
    public readonly game: Game;

    /**
     * @see PlayerId
     */
    public readonly idNumber: Player.Id;

    private _hostTile: Tile;

    /**
     * A {@link Tile} that can only be occupied by this `Player`.
     */
    public readonly benchTile: Tile;

    private _score:         number;
    private _stockpile:     number;
    private _isDowned:      boolean;
    private _isFrozen:      boolean;
    private _isBubbling:    boolean;
    private _percentBubbleCharge: number;



    protected constructor(game: Game, idNumber: Player.Id) {
        if (Math.trunc(this.idNumber) !== this.idNumber) {
            throw new RangeError("Player ID's must be integer values.");
        }
        if (idNumber === Player.Id.NULL) {
            throw new RangeError(`The ID \"${Player.Id.NULL}\" is reserved to mean \"no player\".`);
        }
        this.game = game;
        this.idNumber = idNumber;
        this.benchTile = this.game.createTile(Player.BENCH_POS);
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
            seq: this.idNumber.toString(),
        });
        this._hostTile = this.benchTile;
        this.score = 0;
        this.stockpile = 0;
        this.isDowned = false;
        this.isFrozen = false;
        this.isBubbling = false;
        this.percentBubbleCharge = 0;
        this._hostTile.setOccupant(this.visibleState);
    }



    public get hostTile(): Tile {
        return this._hostTile;
    }

    public get visibleState(): PlayerSkeleton.VisibleState {
        return {
            idNumber: this.idNumber,
            isDowned: this.isDowned,
            isFrozen: this.isFrozen,
            isBubbling: this.isBubbling,
            percentBubbleCharge: this.percentBubbleCharge,
        };
    }



    /**
     * Evicts this `Player` from its last known position (which may be
     * lagging behind the state of the master copy of the game.
     * 
     * This must be called after all same-event changes pertaining to
     * this player's fields have been enacted.
     *
     * @param dest -
     */
    public moveTo(dest: Tile): void {
        // Evict self from current `Tile`.
        if (this.hostTile.occupantId !== this.idNumber) {
            if (this.game.gameType !== Game.Type.CLIENT) {
                // Should never happen.
                throw new Error("Linkage between player and occupied tile disagrees.");
            }
            // Otherwise, this corner case is guaranteed to follow the events
            // described in the below comment: at this `ClientGame`, `p2` will
            // move off of the `Tile` currently occupied by this `Player`.
        }
        else {
            // Move off of current host `Tile`:
            this._hostTile.evictOccupant();
        }
        // Occupy the destination `Tile.
        if (dest.isOccupied()) {
            if (this.game.gameType !== Game.Type.CLIENT) {
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
        }
        else {
            // Move to occupy the destination `Tile`:
            this._hostTile = dest;
            dest.setOccupant(this.visibleState);
        }
    }



    public get score(): number {
        return this._score;
    }
    public set score(newValue: number) {
        // TODO: render this in the browser if not a ServerGame
        this._score = newValue;
    }

    public get stockpile(): number {
        return this._stockpile;
    }
    public set stockpile(stockpile: number) {
        this._stockpile = stockpile;
    }



    public get isDowned(): boolean {
        return this._isDowned;
    }
    public set isDowned(isDowned: boolean) {
        this._isDowned = isDowned;
    }

    public get isFrozen(): boolean {
        return this._isFrozen;
    }
    public set isFrozen(isFrozen: boolean) {
        this._isFrozen = isFrozen;
    }

    public get isBubbling(): boolean {
        return this._isBubbling;
    }
    public set isBubbling(isBubbling: boolean) {
        this._isBubbling = isBubbling;
    }

    public get percentBubbleCharge(): number {
        return this._percentBubbleCharge;
    }
    public set percentBubbleCharge(bubbleCharge: number) {
        this._percentBubbleCharge = bubbleCharge;
    }

}



export namespace PlayerSkeleton {

    /**
     * Information used by a {@link VisibleTile} to decide how to
     * render the specified player. See {@link VisibleTile#occupantId}.
     * 
     * All fields are readonly.
     */
    export type VisibleState = Readonly<{
        idNumber:   Player.Id;
        isDowned:   boolean;
        isFrozen:   boolean;
        isBubbling: boolean;
        percentBubbleCharge: number;
    }>;

    export namespace VisibleState {
        /**
         * Use for Tile-occupant eviction.
         */
        export const NULL = Object.freeze(<const>{
            idNumber:   Player.Id.NULL,
            isDowned:   false,
            isFrozen:   false,
            isBubbling: false,
            percentBubbleCharge: 0,
        });
        NULL as VisibleState;
    }

}
