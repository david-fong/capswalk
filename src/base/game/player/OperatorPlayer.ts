import { JsUtils } from ":defs/JsUtils";
import type { Lang, Lang as _Lang } from ":defs/TypeDefs";
import { Game } from ":game/Game";

import type { Coord } from ":floor/Tile";
import type { GameMirror } from ":game/gameparts/GameMirror";

import { Player } from "./Player";

/**
 * There is at least one in online-clientside and offline games.
 * There are none for online-serverside games.
 * @final
 */
export class OperatorPlayer extends Player {

	/** @override */
	declare public readonly game: GameMirror<any>;

	/**
	 * Invariant: always matches the prefix of the {@link LangSeq} of
	 * an unoccupied neighbouring {@link Tile}.
	 */
	#seqBuffer: string;

	readonly #langRemappingFunc: {(input: string): string};


	public constructor(game: GameMirror<any>, desc: Player._CtorArgs["HUMAN"], langDesc: Lang.Desc) {
		super(game, desc);
		Object.seal(this); //🧊
		this.#langRemappingFunc = langDesc.remapFunc;
	}

	public reset(coord: Coord): void {
		super.reset(coord);
		this.#seqBuffer = "";
	}

	public get seqBuffer(): string {
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
					this.game.grid.getUntAwayFrom(this.prevCoord, this.coord),
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
		const unts = this.game.grid.tileDestsFrom(this.reqBuffer.predictedCoord)
			.filter((tile) => !this.game.grid.isOccupied(tile.coord));
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
			let newSeqBuffer: string = this.seqBuffer + key;
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
	public _setCoord(dest: Coord): void {
		// Clear my `seqBuffer` first:
		this.#seqBuffer = "";

		super._setCoord(dest);
	}
}
Object.freeze(OperatorPlayer);
Object.freeze(OperatorPlayer.prototype);