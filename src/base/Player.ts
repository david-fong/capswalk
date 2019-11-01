
/**
 * 
 */
abstract class Player {

    readonly game: Game;

    /**
     * An integer value unique to this `Player` in this `game`. If
     * this `Player` is human-controlled, this value is non-negative,
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
     * 
     */
    public abstract makeMovementRequest(): void;



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
