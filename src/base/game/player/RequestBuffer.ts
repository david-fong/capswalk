import { JsUtils } from "defs/JsUtils";
import { Game } from "game/Game";

import type { Coord }       from "floor/Tile";
import type { StateChange } from "game/StateChange";
import { Player as _Player } from "defs/TypeDefs";

/**
 * Used to buffer requests when there is network delay.
 *
 * This allows for the client to pipeline a certain number of
 * requests. If a request is rejected, all following requests are
 * invalid, and the server can
 */
export class RequestBuffer {

	#lastRejectId = 0; public get lastRejectId(): number { return this.#lastRejectId; };
	private length = 0;
	public predictedCoord: Coord;

	public reset(coord: Coord): void {
		this.#lastRejectId = 0;
		this.length = 0;
		this.predictedCoord = coord;
	}

	public get isFull(): boolean {
		return this.length === Game.K._REQUEST_BUFFER_LENGTH;
	}

	/** @requires `!this.isFull` */
	public signRequest(req: StateChange.Req): StateChange.Req {
		if (DEF.DevAssert && this.isFull) {
			throw new Error("never");
		}
		this.length++;
		this.predictedCoord = req.moveDest;
		return req;
	}

	public getNextRejectId(): number {
		// return (this.lastRejectId === 0) ? 1 : 0;
		// Above option returns an "elegant" value.
		// Below returns a hard-to-guess value.
		return (this.lastRejectId + Math.floor(99 * Math.random())) % 100;
	}
	/**
	 * Every request signed with the previous rejectId will be
	 * silently dropped by the game manager.
	 */
	public reject(rejectId: number, realCoord: number): void {
		this.#lastRejectId = rejectId;
		this.length = 0;
		this.predictedCoord = realCoord;
	}
	public acceptOldest(): void {
		// TODO.design this is technically invalid for artificial players
		// on the client side of an online game... Can we move reqBuffer
		// to be just for OperatorPlayers?

		// if (DEF.DevAssert && this.length === 0) {
		// 	throw new Error("never");
		// }
		this.length--;
	}
}
Object.freeze(RequestBuffer);
Object.freeze(RequestBuffer.prototype);