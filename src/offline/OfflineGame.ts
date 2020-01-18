import { Coord } from "floor/Coord";
import { VisibleTile } from "floor/VisibleTile";
import { Game } from "game/Game";
import { LocalGameSettings } from "settings/GameSettings";

import { Player } from "game/player/Player";
import { OperatorPlayer } from "game/player/OperatorPlayer";
import { OfflineOperatorPlayer } from "./OfflineOperatorPlayer";
import { ArtificialPlayer } from "game/player/ArtificialPlayer";


type G = Game.Type.OFFLINE;

/**
 * 
 * 
 * @extends Game
 */
export class OfflineGame<S extends Coord.System> extends Game<G,S> {

    protected settings: LocalGameSettings;



    /**
     * _Calls reset recursively for this entire composition._
     * 
     * @param desc - 
     */
    public constructor(desc: Game.CtorArgs<G,S>) {
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
    protected createOperatorPlayer(desc: Player.CtorArgs): OperatorPlayer<S> {
        return new OfflineOperatorPlayer<S>(this, desc);
    }

    /**
     * @override
     */
    protected createArtifPlayer(desc: Player.CtorArgs): ArtificialPlayer<S> {
        return ArtificialPlayer.of(this, desc);
    }



    public setTimeout(callback: TimerHandler, millis: number, ...args: any[]): number {
        return setTimeout(callback, millis, args);
    }

    public cancelTimeout(handle: number): void {
        clearTimeout(handle);
    }

}
