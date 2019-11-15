import { Pos, Tile } from "src/base/Tile";
import { Game } from "src/base/Game";
import { BarePos } from "src/Pos";
import { LangCharSeqPair } from "src/Lang";

/**
 * 
 */
export abstract class Player {

    /**
     * The game object that this player belongs to.
     */
    public readonly game: Game;

    /**
     * An integer value unique to this `Player` in this {@link Game}.
     * If this `Player` is human-controlled, this value is non-negative,
     * and otherwise, it is negative.
     */
    public readonly idNumber:   number;
    protected       _isAlive:   boolean;
    protected       _score:     number;
    protected       _hostTile:  Tile;



    public constructor(game: Game, idNumber: number) {
        this.game = game;
        this.idNumber = idNumber;
    }

    public reset(): void {
        this._isAlive   = true;
        this._score     = 0;
        this._hostTile  = null;
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
     * This operation should never fail. If two `Player`s attempt to
     * move to move to the same position, since javascript and Node
     * are singlethreaded, one request will be handled first, the other
     * will be handled second and "dropped" by the Game Manager. If
     * Another player makes successful requests entering and leaving
     * some position `A`, and then I make a request to move to A
     * before receiving the changes made as an effect of the other
     * player's movements, the Game Manager will drop my request, or
     * else it could happen that I receive the thumbs-up for my action
     * and make those changes before 
     * 
     * @param dest - 
     * 
     * @throws `Error` if `dest` is occupied by another `Player`.
     */
    public abstract makeMovementRequest(dest: Tile): void;

    public moveTo(dest: Tile): void {
        if (dest.isOccupied()) {
            throw new Error("Only one player can occupy a tile at a time.");
        }
        // Move off of current host `Tile`:
        this._hostTile.evictOccupant();

        // Move to occupy the destination `Tile`:
        this._hostTile = dest;
        dest.occupantId = this.idNumber;

        // TODO: is there more to do?
    }



    public get pos(): Pos {
        return this._hostTile.pos;
    }

    public get score(): number {
        return this._score;
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
