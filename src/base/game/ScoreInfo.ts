import type { Player } from "./player/Player";


/**
 *
 */
export class ScoreInfo {

    public readonly entries: TU.RoArr<ScoreInfo.Entry>;

    public constructor(playerIds: TU.RoArr<Player.Id>) {
        const entries: Array<ScoreInfo.Entry> = [];
        for (const id of playerIds) {
            entries[id] = new ScoreInfo.Entry();
        }
        this.entries = entries;
    }

    public reset(): void {
        for (const entry of this.entries) {
            entry.reset();
        }
    }
}
export namespace ScoreInfo {
    /**
     *
     */
    export class Entry {

        public totalHealthPickedUp: Player.Health;

        public reset(): void {
            this.totalHealthPickedUp = 0.0;
        }
    }
    Object.freeze(Entry);
    Object.freeze(Entry.prototype);
}
Object.freeze(ScoreInfo);
Object.freeze(ScoreInfo.prototype);
