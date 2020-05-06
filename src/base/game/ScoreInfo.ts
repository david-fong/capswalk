import type { Player } from "./player/Player";
import { Player as __Player } from "defs/TypeDefs";


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

        // TODO.design how to send this imfo to the game manager?
        // It is currently checked on the client side.
        //public invalidKeyPresses

        public readonly moveCounts: {[M in Player.MoveType]: number};

        public constructor() {
            this.moveCounts = {} as any; // This will be initialized during reset.
        }

        public reset(): void {
            this.totalHealthPickedUp = 0.0;
            (Object.getOwnPropertyNames(__Player.MoveType) as
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
