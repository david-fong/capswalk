import { Coord } from "floor/Coord";
import { VisibleTile } from "floor/VisibleTile";
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
export class OfflineGame<S extends Coord.System> extends Game<S> {

    /**
     * @override The Operator is always defined for a {@link OfflineGame}.
     */
    public declare readonly operator: HumanPlayer<S>;

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
    public constructor(desc: Game.CtorArgs<S>) {
        super(desc, VisibleTile);
        if (!this.operator) {
            throw new Error("The Operator for a ClientGame should be defined.");
        }
        this.settings = LocalGameSettings.getInstance();

        this.reset();
    }

    /**
     * @override
     */
    protected createOperatorPlayer(desc: Player.CtorArgs): HumanPlayer<S> {
        return new OfflineHumanPlayer<S>(this, desc);
    }



    public setTimeout(callback: TimerHandler, millis: number, ...args: any[]): number {
        return setTimeout(callback, millis, args);
    }

    public cancelTimeout(handle: number): void {
        clearTimeout(handle);
    }

}
