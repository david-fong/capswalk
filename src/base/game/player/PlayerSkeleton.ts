import { JsUtils } from "defs/JsUtils";
import { Player as _Player } from "defs/TypeDefs";
import { Game } from "game/Game";

import type { Coord, Tile } from "floor/Tile";
import type { Player } from "./Player";
import type { GamepartBase } from "game/gameparts/GamepartBase";
import type { PlayerStatus } from "./PlayerStatus";

import { TileGetter } from "floor/TileGetter";


/**
 * Made to abstract all operations that change the `hostTile`
 * field. Enforces / exposes the `moveTo` method as
 * the interface to any such operations.
 *
 * @extends Player to intake its namespace exports.
 */
export abstract class PlayerSkeleton<S extends Coord.System> extends _Player<S> {

	public readonly playerId: Player.Id;

	public readonly isALocalOperator: boolean;

	/**
	 * The game object that this player belongs to.
	 */
	public readonly game: GamepartBase<any,S>;

	public readonly status: PlayerStatus<S>;

	#hostTile: Tile<S>;

	public readonly tile: TileGetter<S,[]>;


	protected constructor(game: GamepartBase<any,S>, desc: Player.CtorArgs) {
		super();
		if (Math.trunc(desc.playerId) !== desc.playerId) {
			throw new RangeError("Player ID's must be integer values.");
		}
		this.playerId = desc.playerId;
		this.isALocalOperator = desc.isALocalOperator;
		this.game = game;
		this.status = new (this.game._playerStatusCtor)(
			this as PlayerSkeleton<S> as Player<S>,
			desc.noCheckGameOver,
		);
		this.tile = new TileGetter(new PlayerSkeleton.TileGetterSource(this));
		JsUtils.instNoEnum( this as PlayerSkeleton<S>, ["game"]);
		JsUtils.propNoWrite(this as PlayerSkeleton<S>, [
			"playerId", "isALocalOperator",
			"game", "status", "tile",
		]);
	}

	public _afterAllPlayersConstruction(): void {
		this.status._afterAllPlayersConstruction();
	}

	/**
	 * Must be called _after_ the {@link Grid} has been reset.
	 * Does not evict itself from its current host tile (if it
	 * has one).
	 *
	 * @param spawnTile -
	 */
	protected reset(spawnTile: Tile<S>): void {
		this.#hostTile = spawnTile;
		this.hostTile._setOccupant(
			this.playerId,
			this.status.immigrantInfo,
		);
	}


	public get coord(): Coord[S] {
		return this.hostTile.coord;
	}

	public get hostTile(): Tile<S> {
		return this.#hostTile;
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
			if (DEF.DevAssert && this.game.gameType !== Game.Type.ONLINE) {
				// Should never happen.
				throw new Error("Linkage between player and occupied tile disagrees.");
			}
			/* Otherwise, this corner case is guaranteed to follow the events
			described in the below comment: at this `OnlineGame`, `p2` will
			move off of the `Tile` currently occupied by this `Player`. */
		}
		else {
			// Move off of current host `Tile`:
			this.hostTile.evictOccupant();
		}
		// Occupy the destination `Tile.
		if (dest.isOccupied) {
			if (DEF.DevAssert && this.game.gameType !== Game.Type.ONLINE) {
				// Should be enforced by `GamepartManager`
				throw new Error("Only one player can occupy a tile at a time.");
			}
			/* Otherwise, this is actually possible in a variant of the _DAS_
			where another `Player` `p2` moves to `B`, I receive that update,
			then `p2` makes a request to move to `C`, which the Game Manager
			accepts and begins to notify my `OnlineGame` of, but between the
			time that the GM accepts the request and when I receive the update,
			I make a request to move to `B`, which gets accepted by the GM,
			and because I might not be using websockets as my underlying
			transport, I receive the update for my own request first, which
			would appear to my `OnlineGame` as if I was moving onto the `Tile`
			occupied by `p2`. */
		}
		else {
			// Move to occupy the destination `Tile`:
			this.#hostTile = dest;
			dest._setOccupant(this.playerId, this.status.immigrantInfo);
		}
	}
}
export namespace PlayerSkeleton {
	/**
	 */
	export class TileGetterSource<S extends Coord.System> implements TileGetter.Source<S,[]> {

		readonly #player: PlayerSkeleton<S>;
		readonly #superTileSrc: TileGetter.Source<S,[Coord.Bare[S]]>;

		public constructor(player: PlayerSkeleton<S>) {
			this.#player = player;
			this.#superTileSrc = player.game.grid.tile._source;
		}

		public _getTileAt(): Tile<S> {
			return this.#superTileSrc._getTileAt(this.#player.coord);
		}

		public _getTileDestsFrom(): Array<Tile<S>> {
			return this.#superTileSrc._getTileDestsFrom(this.#player.coord);
		}

		public _getTileSourcesTo(): Array<Tile<S>> {
			return this.#superTileSrc._getTileSourcesTo(this.#player.coord);
		}
	}
	Object.freeze(TileGetterSource);
	Object.freeze(TileGetterSource.prototype);
}
JsUtils.protoNoEnum(PlayerSkeleton, ["_afterAllPlayersConstruction"]);
Object.freeze(PlayerSkeleton);
Object.freeze(PlayerSkeleton.prototype);