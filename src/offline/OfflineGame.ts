import { BarePos } from "src/Pos";
import { VisibleTile } from "src/offline/VisibleTile";
import { GridDimensionDesc, Game } from "src/base/Game";
import { LocalGameSettings } from "src/settings/GameSettings";

import { PlayerId } from "src/base/player/Player";
import { HumanPlayer } from "src/base/player/HumanPlayer";
import { OfflineHumanPlayer } from "src/offline/OfflineHumanPlayer";
import { ArtificialPlayer } from "src/base/player/ArtificialPlayer";

/**
 * 
 * 
 * @extends Game
 */
export class OfflineGame extends Game {

    protected settings: LocalGameSettings;

    /**
     * _Calls reset recursively for this entire composition._
     * 
     * @param dimensions - 
     */
    public constructor(dimensions: GridDimensionDesc) {
        super(dimensions);
        this.settings = LocalGameSettings.getInstance();

        this.reset();
    }

    /**
     * @override
     */
    public createTile(pos: BarePos): VisibleTile {
        return new VisibleTile(pos);
    }

    /**
     * @override
     */
    protected createOperatorPlayer(idNumber: PlayerId): HumanPlayer {
        return new OfflineHumanPlayer(this, idNumber);
    }

    /**
     * @override
     */
    protected createArtifPlayer(idNumber: PlayerId): ArtificialPlayer {
        return undefined;
    }



    public setTimeout(callback: TimerHandler, millis: number, ...args: any[]): number {
        return setTimeout(callback, millis, args);
    }

    public cancelTimeout(handle: number): void {
        clearTimeout(handle);
    }

}
