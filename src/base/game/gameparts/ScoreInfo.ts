import { JsUtils } from "defs/JsUtils";
import { Player } from "../player/Player";


/**
 * Information about each Player's scores and statistics since the
 * last Game reset. This is separated from Player instances since
 * non-GameManagers have no need to maintain such records throughout
 * the game.
 *
 * @final
 */
export class ScoreInfo {

	/**
	 * A map from player ID's to information about their scores.
	 */
	public readonly entries: readonly ScoreInfo.Entry[];

	public constructor(playerIds: readonly Player.Id[]) {
		const entries: Array<ScoreInfo.Entry> = [];
		for (const id of playerIds) {
			entries[id] = new ScoreInfo.Entry();
		}
		this.entries = entries;
		JsUtils.propNoWrite(this as ScoreInfo, "entries");
		Object.seal(this); //🧊
	}

	public reset(): void {
		for (const entry of this.entries) {
			entry.reset();
		}
	}
}
export namespace ScoreInfo {
	/**
	 */
	export class Entry {

		public readonly moveCounts: {[M in Player.MoveType]: number};

		// TODO.design how to send this info to the game manager?
		// It is currently checked on the client side.
		//public invalidKeyPresses

		public constructor() {
			this.moveCounts = {} as any; // This will be initialized during reset.
		}

		public reset(): void {
			(Object.getOwnPropertyNames(Player.MoveType) as
				Array<Player.MoveType>).forEach((key) => {
				this.moveCounts[key] = 0;
			});
		}
	}
	Object.freeze(Entry);
	Object.freeze(Entry.prototype);
}
Object.freeze(ScoreInfo);
Object.freeze(ScoreInfo.prototype);