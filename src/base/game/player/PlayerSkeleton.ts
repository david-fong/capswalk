import { JsUtils } from "defs/JsUtils";
import { Player as _Player } from "defs/TypeDefs";

import type { Coord, Tile } from "floor/Tile";
import type { Player } from "./Player";
import type { GameMirror } from "base/game/gameparts/GameMirror";
import { PlayerStatus } from "./PlayerStatus";


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

	public readonly game: GameMirror<any,S>;

	public readonly status: PlayerStatus<S>;

	#coord: Coord; public get coord(): Coord { return this.#coord; }
	public prevCoord: Coord;


	protected constructor(game: GameMirror<any,S>, desc: Player.CtorArgs) {
		super();
		if (Math.trunc(desc.playerId) !== desc.playerId) {
			throw new RangeError("Player ID's must be integer values.");
		}
		this.playerId = desc.playerId;
		this.isALocalOperator = desc.isALocalOperator;
		this.game = game;
		this.status = new PlayerStatus(
			this as PlayerSkeleton<S> as Player<S>,
		);
		JsUtils.instNoEnum(this as PlayerSkeleton<S>, "game");
		JsUtils.propNoWrite(this as PlayerSkeleton<S>, "playerId", "isALocalOperator", "game", "status");
	}

	public _afterAllPlayersConstruction(): void {
		this.status._afterAllPlayersConstruction();
	}

	/**
	 * Must be called _after_ the grid has been reset.
	 */
	public reset(coord: Coord): void {
		this.#coord = coord;
		this.prevCoord = coord;
	}

	/**
	 * Notify this Player.
	 *
	 * Causes this Player to update its internal state.
	 */
	public moveTo(dest: Coord): void {
		this.prevCoord = this.coord;
		this.#coord = dest;
	}
}
JsUtils.protoNoEnum(PlayerSkeleton, "_afterAllPlayersConstruction");
Object.freeze(PlayerSkeleton);
Object.freeze(PlayerSkeleton.prototype);