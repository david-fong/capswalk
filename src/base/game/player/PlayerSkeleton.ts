import { Player as PlayerTypeDefs, PlayerSkeleton as PlayerSkeletonTypeDefs } from "utils/TypeDefs";

import { Tile, Coord } from "floor/Tile";
import { TileGetter } from "floor/TileGetter";
import { Game } from "game/Game";
import { Player } from "./Player";


/**
 * Made to abstract all operations that change the {@link Player#hostTile}
 * field. Enforces / exposes the {@link PlayerSkeleton#moveTo} method as
 * the interface to any such operations.
 * 
 * @extends PlayerTypeDefs to intake its namespace exports.
 */
export class PlayerSkeleton<S extends Coord.System> extends PlayerTypeDefs<S>
    implements PlayerSkeletonTypeDefs.VisibleState {

    public readonly playerId: Player.Id;

    /**
     * The game object that this player belongs to.
     */
    public readonly game: Game<any,S>;

    private _hostTile: Tile<S>;

    public readonly tile: TileGetter<S,[]>;

    private _score:         number;
    private _stockpile:     number;
    private _isDowned:      boolean;
    private _isFrozen:      boolean;
    private _isBubbling:    boolean;
    private _percentBubbleCharge: number;



    protected constructor(game: Game<any,S>, playerId: Player.Id) {
        super();
        if (Math.trunc(playerId.intraClassId) !== playerId.intraClassId) {
            throw new RangeError("Player ID's must be integer values.");
        }
        this.playerId = playerId;
        this.game = game;
        this.tile = new TileGetter(new PlayerSkeleton.TileGetterSource(this));
    }

    /**
     * Must be called _after_ the {@link Grid} has been reset.
     * Does not evict itself from its current host tile (if it
     * has one).
     * 
     * @param spawnTile -
     */
    protected reset(spawnTile: Tile<S>): void {
        this._hostTile = spawnTile;
        this.score = 0;
        this.stockpile = 0;
        this.isDowned = false;
        this.isFrozen = false;
        this.isBubbling = false;
        this.percentBubbleCharge = 0;
        this.hostTile.setOccupant(this.visibleState); // (todo) keep
    }



    public get coord(): Player<S>["hostTile"]["coord"] {
        return this.hostTile.coord;
    }

    public get hostTile(): PlayerSkeleton<S>["_hostTile"] {
        return this._hostTile;
    }

    public get visibleState(): PlayerSkeletonTypeDefs.VisibleState {
        return {
            playerId: this.playerId,
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
    public moveTo(dest: Tile<S>): void {
        // Evict self from current `Tile`.
        if (this.hostTile.occupantId !== this.playerId) {
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
            this.hostTile.evictOccupant();
        }
        // Occupy the destination `Tile.
        if (dest.isOccupied) {
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
            dest.setOccupant(this.visibleState); // (todo) keep
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



    // NOTE: these are actually probably going to be useful for hooks
    // of sound effects. But it feels awkward that they require a
    // separate call (this.hostTile.setOccupant(this.visibleState) to
    // make visible changes ;?

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

    export class TileGetterSource<S extends Coord.System> implements TileGetter.Source<S,[]> {

        public constructor(private readonly player: PlayerSkeleton<S>) { }

        public __getTileAt(): Tile<S> {
            return this.player.game.grid.tile.at(this.player.coord);
        }

        public __getTileDestsFrom(): Array<Tile<S>> {
            return this.player.game.grid.tile.destsFrom(this.player.coord).get;
        }

        public __getTileSourcesTo(): Array<Tile<S>> {
            return this.player.game.grid.tile.sourcesTo(this.player.coord).get;
        }
    }

}
