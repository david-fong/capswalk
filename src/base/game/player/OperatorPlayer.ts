import { JsUtils } from "defs/JsUtils";
import type { Lang as _Lang } from "defs/TypeDefs";
import { Game } from "game/Game";

import type { GameMirror } from "base/game/gameparts/GameMirror";
import type { Coord, Tile } from "floor/Tile";

import { Player } from "./Player";


/**
 * There is at least one in online-clientside and offline games.
 * There are none for online-serverside games.
 */
export class OperatorPlayer<S extends Coord.System> extends Player<S> {

	/** @override */
	declare public readonly game: GameMirror<(Game.Type.Browser),S>;

	/**
	 * Invariant: always matches the prefix of the {@link LangSeq} of
	 * an unoccupied neighbouring {@link Tile}.
	 */
	#seqBuffer: _Lang.Seq;

	readonly #langRemappingFunc: {(input: string): string};


	public constructor(game: GameMirror<Game.Type,S>, desc: Player._CtorArgs<"HUMAN">) {
		super(game, desc);
		this.#langRemappingFunc = this.game.langFrontend.remapFunc;
	}

	public reset(coord: Coord): void {
		super.reset(coord);
		this.#seqBuffer = "";
	}

	public get seqBuffer(): _Lang.Seq {
		return this.#seqBuffer;
	}


	/**
	 * Callback function invoked when the Operator presses a key while
	 * the game's html element has focus. Because of how JavaScript
	 * and also Node.js run in a single thread, this is an atomic
	 * operation (implementation must not intermediately schedule any
	 * other task-relevant callbacks until all critical operations are
	 * complete).
	 */
	public processKeyboardInput(event: KeyboardEvent): void {
		if (this.game.status !== Game.Status.PLAYING
		 || this.reqBuffer.isFull
		) return; //⚡

		if (event.key === " ") {
			if (this.coord !== this.prevCoord) {
				this.makeMovementRequest(
					this.game.grid.getUntAwayFrom(this.prevCoord, this.coord).coord,
					Player.MoveType.BOOST,
				);
			}
		} else if (event.key.length === 1 && !event.repeat) {
			// TODO.learn is the above condition okay? will any
			// languages require different behaviour?
			this.seqBufferAcceptKey(event.key);
		}
	}

	/**
	 * Automatically makes a call to make a movement request if the
	 * provided `key` completes the `LangSeq` of a UNT. Does not do
	 * any checking regarding {@link OperatorPlayer#requestInFlight}.
	 *
	 * @param key
	 * The pressed typeable key as a string. Pass an empty string to
	 * trigger a refresh of the seqBuffer to maintain its invariant.
	 */
	public seqBufferAcceptKey(key: string | undefined): void {
		const unts = this.game.grid.tile.destsFrom(this.reqBuffer.predictedCoord).unoccupied.get;
		if (unts.length === 0) {
			// Every neighbouring `Tile` is occupied!
			// In this case, no movement is possible.
			return;
		}
		if (key === undefined) {
			const possibleTarget = unts.find((tile) => tile.seq.startsWith(this.seqBuffer));
			if (!possibleTarget) {
				// If the thing I was trying to get to is gone, clear the buffer.
				this.#seqBuffer = "";
			}
			return; //⚡
		} else {
			key = this.#langRemappingFunc(key);
		}

		for ( // loop through substring start offset of newSeqBuffer:
			let newSeqBuffer: _Lang.Seq = this.seqBuffer + key;
			newSeqBuffer.length;
			newSeqBuffer = newSeqBuffer.substring(1)
		) {
			// look for the longest suffixing substring of `newSeqBuffer`
			// that is a prefixing substring of any UNT's.
			const possibleTarget = unts.find((tile) => tile.seq.startsWith(newSeqBuffer));
			if (possibleTarget !== undefined) {
				this.#seqBuffer = newSeqBuffer;
				if (possibleTarget.seq === newSeqBuffer) {
					this.makeMovementRequest(possibleTarget.coord, "NORMAL");
				}
				return;
			}
		}
		// Operator's new `seqBuffer` didn't match anything.
		this.#seqBuffer = "";
	}

	/**
	 * Automatically clears the seqBuffer.
	 * @override
	 */
	public moveTo(dest: Coord): void {
		// Clear my `seqBuffer` first:
		this.#seqBuffer = "";

		super.moveTo(dest);
	}
}
Object.freeze(OperatorPlayer);
Object.freeze(OperatorPlayer.prototype);