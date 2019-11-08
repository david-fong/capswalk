import { Pos } from "src/Pos";
import { Tile } from "src/base/Tile";
import { Game } from "src/base/Game";

/**
 * 
 */
export abstract class Player {

    /**
     * The game object that this player belongs to.
     */
    readonly game: Game;

    /**
     * An integer value unique to this `Player` in this {@link Game}.
     * If this `Player` is human-controlled, this value is non-negative,
     * and otherwise, it is negative.
     */
    readonly     idNumber:  number;
    protected   _isAlive:   boolean;
    protected   _score:     number;
    protected   _hostTile:  Tile;



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
     * 
     * @param dest - 
     * 
     * @throws `Error` if `dest` is occupied by another `Player`.
     */
    public abstract makeMovementRequest(dest: Pos): void;

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
