import { Pos, Tile } from "src/base/Tile";
import { Game } from "src/base/Game";
import { PlayerMovementEvent } from "src/events/PlayerMovementEvent";
import { PlayerSkeleton } from "src/base/player/PlayerSkeleton";


/**
 * An **integer value** used to uniquely identify `Player`s in the
 * same {@link Game} together. Strictly negative values correspond to
 * {@link ArtificialPlayer}s, strictly positive values correspond to
 * {@link HumanPlayer}s, and the value `zero` is reserved to indicate
 * that a {@link Tile} is unoccupied (See {@link PlayerId.NULL}).
 */
export type PlayerId = number;

export namespace PlayerId {
    export const NULL = 0;
}



/**
 * 
 */
export abstract class Player extends PlayerSkeleton {

    public static readonly BENCH_POS: Pos = new Pos(Infinity, Infinity);

    /**
     * Managed externally by the Game Manager. Here for composition.
     */
    public bubbleTimer: number | NodeJS.Timeout;

    public lastAcceptedRequestId: number;

    public requestInFlight: boolean;



    public constructor(game: Game, idNumber: PlayerId) {
        super(game, idNumber);
    }

    public reset(): void {
        super.reset();
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



    public getNeighbouringTiles(radius: number = 1): Array<Tile> {
        return this.game.getNeighbouringTiles(this.pos, radius);
    }

    public getUNT(radius: number = 1): Array<Tile> {
        return this.game.getUNT(this.pos, radius);
    }

    public getNeighbours(radius: number = 1): Array<Player> {
        return this.game.getNeighbours(this.pos, radius);
    }

}
