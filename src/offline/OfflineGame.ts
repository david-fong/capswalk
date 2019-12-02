import { BarePos } from "src/Pos";
import { VisibleTile } from "src/offline/VisibleTile";
import { Game } from "src/base/Game";
import { LocalGameSettings } from "src/settings/GameSettings";

import { Player } from "src/base/player/Player";
import { HumanPlayer } from "src/base/player/HumanPlayer";
import { OfflineHumanPlayer } from "src/offline/OfflineHumanPlayer";


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
     * @param desc - 
     */
    public constructor(desc: Game.ConstructorArguments) {
        super(desc);
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
    protected createOperatorPlayer(desc: Player.ConstructorArguments): HumanPlayer {
        return new OfflineHumanPlayer(this, desc);
    }



    public setTimeout(callback: TimerHandler, millis: number, ...args: any[]): number {
        return setTimeout(callback, millis, args);
    }

    public cancelTimeout(handle: number): void {
        clearTimeout(handle);
    }

}
