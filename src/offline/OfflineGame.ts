import type { Coord } from "floor/Coord";
import { VisibleTile } from "floor/VisibleTile";
import { VisibleGrid } from "floor/VisibleGrid";
import { Game } from "game/Game";
import { LocalGameSettings } from "settings/GameSettings";

import type { Player } from "game/player/Player";
import type { OperatorPlayer } from "game/player/OperatorPlayer";
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
     * @override
     */
    protected __getGridImplementation(coordSys: S): VisibleGrid.ClassIf<S> {
        return VisibleGrid.getImplementation(coordSys);
    }



    /**
     * _Calls reset recursively for this entire composition._
     *
     * @param gameDesc -
     */
    public constructor(gameDesc: Game.CtorArgs<G,S>) {
        super(Game.Type.OFFLINE, VisibleTile, gameDesc);
        if (!this.operator) {
            throw new Error("The Operator for an OfflineGame should be defined.");
        }
        this.settings = LocalGameSettings.getInstance();

        this.reset();
    }

    /**
     * @override
     */
    protected __createOperatorPlayer(desc: Player.CtorArgs): OperatorPlayer<S> {
        return new OfflineOperatorPlayer<S>(this, desc);
    }

    /**
     * @override
     */
    protected __createArtifPlayer(desc: Player.CtorArgs): ArtificialPlayer<S> {
        return ArtificialPlayer.of(this, desc);
    }



    public setTimeout(callback: TimerHandler, millis: number, ...args: any[]): number {
        return setTimeout(callback, millis, args);
    }

    public cancelTimeout(handle: number): void {
        clearTimeout(handle);
    }

}
