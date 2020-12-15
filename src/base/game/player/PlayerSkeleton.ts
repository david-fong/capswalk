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

	public readonly game: GamepartBase<any,S>;

	public readonly status: PlayerStatus<S>;

	public readonly tile: TileGetter<[]>;

	public coord: Coord;
	public prevCoord: Coord;


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
		JsUtils.instNoEnum(this as PlayerSkeleton<S>, "game");
		JsUtils.propNoWrite(this as PlayerSkeleton<S>, "playerId", "isALocalOperator", "game", "status", "tile");
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
	public reset(coord: Coord): void {
		this.coord = coord;
		this.prevCoord = coord;
	}

	/**
	 * Notify this Player.
	 *
	 * Causes this Player to update its internal state.
	 */
	public moveTo(dest: Tile): void {
		// TODO.impl
		this.prevCoord = this.coord;
		this.coord = dest.coord;
	}
}
export namespace PlayerSkeleton {
	/**
	 */
	export class TileGetterSource<S extends Coord.System> implements TileGetter.Source<[]> {

		readonly #player: PlayerSkeleton<S>;
		readonly src: TileGetter.Source<[Coord]>;

		public constructor(player: PlayerSkeleton<S>) {
			this.#player = player;
			this.src = player.game.grid;
		}
		public _getTileAt(): Tile {
			return this.src._getTileAt(this.#player.coord);
		}
		public _getTileDestsFrom(): Tile[] {
			return this.src._getTileDestsFrom(this.#player.coord);
		}
		public _getTileSourcesTo(): Tile[] {
			return this.src._getTileSourcesTo(this.#player.coord);
		}
	}
	Object.freeze(TileGetterSource);
	Object.freeze(TileGetterSource.prototype);
}
JsUtils.protoNoEnum(PlayerSkeleton, "_afterAllPlayersConstruction");
Object.freeze(PlayerSkeleton);
Object.freeze(PlayerSkeleton.prototype);