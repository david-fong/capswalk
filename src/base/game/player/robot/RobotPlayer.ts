import { JsUtils } from ":defs/JsUtils";
import { Game } from ":game/Game";
import type { Coord, Tile } from ":floor/Tile";
import type { GameMirror } from ":game/gameparts/GameMirror";

export { JsUtils };
export type { Coord, Tile };
export { GameMirror } from ":game/gameparts/GameMirror";

// Implementations:
import type { Chaser } from "./impl/Chaser";

import { Player } from "../Player";
export { Player };


/**
 * Unlike {@link ClientPlayer}s, these are not guided by human input.
 * Instead, they are essentially defined by how often they move, and
 * where they decide to move toward each time they move.
 *
 * Can be paused and un-paused by the Game Manager.
 */
export abstract class RobotPlayer extends Player {

	#nextMovementTimerMultiplier: number = undefined!;

	#scheduledMovementCallbackId: number = undefined!;

	/**
	 * @see RobotPlayer.of for the public, non-abstract interface.
	 */
	protected constructor(game: GameMirror<any>, desc: Player.CtorArgs) {
		super(game, desc);
	}

	/**
	 * Returns a {@link Pos} representing an absolute coordinate (ie.
	 * one that is relative to the {@link Game}'s origin position')
	 * that this `RobotPlayer` intends to move toward in its next
	 * movement request. Pos may contain non-integer coordinate values,
	 * and it does not have to be inside the bounds of the {@link Grid}.
	 */
	protected abstract computeDesiredDest(): Coord;

	protected abstract getNextMoveType(): Player.MoveType;

	/** Units are in milliseconds. */
	protected abstract computeNextMovementTimer(): number;

	public override onGamePlaying(): void {
		this.#delayedMovementContinue();
	}
	public override onGamePaused(): void {
		this.game.cancelTimeout(this.#scheduledMovementCallbackId);
		this.#scheduledMovementCallbackId = undefined!;
	}
	public override onGameOver(): void {
		this.game.cancelTimeout(this.#scheduledMovementCallbackId);
		this.#scheduledMovementCallbackId = undefined!;
	}

	/**
	 * Executes a single movement and then calls `delayedMovementContinue`.
	 */
	#movementContinue(): void {
		const desiredDest = this.computeDesiredDest();
		// This is a little different than how human players experience
		// "penalties" when moving to tiles with long language-sequences-
		// humans must pay the penalty before landing on the tile, but
		// in the implementation here, it's much easier to simulate such
		// a penalty if it applies _after_ landing on the tile.
		this.#nextMovementTimerMultiplier = this.game.grid.tileAt(desiredDest).seq.length;

		this.makeMovementRequest(
			this.game.grid.getUntToward(desiredDest, this.coord),
			this.getNextMoveType(),
		);
		// Schedule a task to do this again:
		this.#delayedMovementContinue();
	}

	/** Schedules a call to `movementContinue`. */
	#delayedMovementContinue(): void {
		// Schedule the next movement.
		this.#scheduledMovementCallbackId = this.game.setTimeout(
			this.#movementContinue.bind(this),
			this.computeNextMovementTimer() * this.#nextMovementTimerMultiplier,
			// * Callback function arguments go here.
		);
	}
}
export namespace RobotPlayer {

	export interface FamilySpecificPart {
		[Player.Family.Chaser]: Partial<Chaser.Behaviour>;
	}

	/**
	 * Provides slightly higher level abstractions for computing the
	 * desired destination for the next movement.
	 */
	export abstract class Decisive extends RobotPlayer {

		/**
		 * Entries may return undefined to indicate that the condition
		 * for using that behaviour was not met, and the next behaviour
		 * should be tried.
		 *
		 * @requires
		 * The last behaviour must never return `undefined`.
		 */
		protected abstract get _behaviours(): readonly Decisive.Behaviour[];

		readonly #cache = {
			which:  0,
			reuses: 0,
			target: undefined as number | undefined,
		};

		public override reset(coord: Coord): void {
			super.reset(coord);
			this.#cache.which  = 0;
			this.#cache.reuses = 0;
			this.#cache.target = undefined;
		}

		/** @final */
		protected computeDesiredDest(): Coord {
			const c = this.#cache;
			if (c.target !== undefined && c.reuses <= Game.K._ROBOT_PRIORITY_MAX_REUSES) {
				const next = this._behaviours[c.which]!.call(this, c.target);
				if (next !== undefined) {
					c.reuses++;
					return next.dest; //⚡
				}
			}
			c.reuses = 0;
			for (let i = 0; i < this._behaviours.length; i++) {
				const next = this._behaviours[i]!.call(this);
				if (next !== undefined) {
					c.which = i;
					c.target = next.target;
					return next.dest;
				}
			}
			throw new Error("never");
		}
	}
	export namespace Decisive {
		export type Next = undefined | {
			dest: Coord;
			/**
			 * This could be anything a behaviour wants. Ex. A player
			 * ID, a coord, etc.
			 *
			 * It is assumed to be unchanged when successfully reusing
			 * a behaviour.
			 * */
			target?: number;
		};
		export type Behaviour = (target?: number) => Next;
	}
	Object.freeze(Decisive);
	Object.freeze(Decisive.prototype);
}
// RobotPlayer is frozen in PostInit after _Constructors get initialized.
Object.seal(RobotPlayer);
Object.freeze(RobotPlayer.prototype);