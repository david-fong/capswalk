import { BarePos } from "game/floor/Pos";
import { VisibleTile } from "game/floor/VisibleTile";
import { Game } from "game/Game";
import { LocalGameSettings } from "settings/GameSettings";

import { Player } from "game/player/Player";
import { HumanPlayer } from "game/player/HumanPlayer";
import { OfflineHumanPlayer } from "./OfflineHumanPlayer";


/**
 * 
 * 
 * @extends Game
 */
export class OfflineGame extends Game {

    /**
     * @override The Operator is always defined for a {@link OfflineGame}.
     */
    public declare readonly operator: HumanPlayer;

    protected settings: LocalGameSettings;

    /**
     * @override
     */
    public get gameType(): Game.Type {
        return Game.Type.OFFLINE;
    }

    /**
     * _Calls reset recursively for this entire composition._
     * 
     * @param desc - 
     */
    public constructor(desc: Game.CtorArgs) {
        super(desc);
        if (!this.operator) {
            throw new Error("The Operator for a ClientGame should be defined.");
        }
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
    protected createOperatorPlayer(desc: Player.CtorArgs): HumanPlayer {
        return new OfflineHumanPlayer(this, desc);
    }



    public setTimeout(callback: TimerHandler, millis: number, ...args: any[]): number {
        return setTimeout(callback, millis, args);
    }

    public cancelTimeout(handle: number): void {
        clearTimeout(handle);
    }

}
