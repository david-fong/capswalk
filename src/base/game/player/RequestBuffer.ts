import { JsUtils } from ":defs/JsUtils";
import { Game } from ":game/Game";

import type { Coord }        from ":floor/Tile";
import type { StateChange }  from ":game/StateChange";
import { Player as _Player } from ":defs/TypeDefs";

/**
 * Used on the clientside to buffer requests when there is network
 * delay. If a request gets rejected, the whole buffer is invalidated.
 */
export class RequestBuffer {

	#lastRejectId = 0; public get lastRejectId(): number { return this.#lastRejectId; }
	private size = 0;
	public predictedCoord: Coord;

	public reset(coord: Coord): void {
		this.#lastRejectId = 0;
		this.size = 0;
		this.predictedCoord = coord;
	}

	public get isFull(): boolean {
		return this.size === Game.K._REQUEST_BUFFER_LENGTH;
	}

	/** @requires `!this.isFull` */
	public signRequest(req: StateChange.Req): StateChange.Req {
		if (DEF.DevAssert && this.isFull) {
			throw new Error("never");
		}
		this.size++;
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
		this.size = 0;
		this.predictedCoord = realCoord;
	}
	public acceptOldest(): void {
		this.size--;
	}
}
Object.freeze(RequestBuffer);
Object.freeze(RequestBuffer.prototype);