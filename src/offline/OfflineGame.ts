import { Game } from "game/Game";

import { LocalGameSettings }    from "../webui/GameSettings";
import type { Coord }           from "floor/Tile";
import { VisibleTile }          from "floor/VisibleTile";
import { VisibleGrid }          from "floor/VisibleGrid";

import type { Player }          from "game/player/Player";
import { OperatorPlayer }       from "game/player/OperatorPlayer";
import { VisiblePlayerStatus }  from "game/player/VisiblePlayerStatus";
import { ArtificialPlayer }     from "game/player/ArtificialPlayer";

import { GameManager } from "game/__gameparts/Manager";


type G = Game.Type.OFFLINE;

/**
 *
 *
 * @extends Game
 */
export class OfflineGame<S extends Coord.System> extends GameManager<G,S> {

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
        super(
            Game.Type.OFFLINE, {
            tileClass: VisibleTile,
            playerStatusCtor: VisiblePlayerStatus,
            }, gameDesc,
        );
        if (!this.operator) {
            throw new Error("The Operator for an OfflineGame should be defined.");
        }
        this.settings = LocalGameSettings.getInstance();

        // =====================================
        // CALL TO RESET
        this.reset();
        // =====================================

        document.body.onkeydown = ((ev) => {
            console.log("hi", ev.key);
            this.operator.processKeyboardInput(ev);
        });
    }

    /**
     * @override
     */
    protected __createOperatorPlayer(desc: Player.CtorArgs): OperatorPlayer<S> {
        return new OperatorPlayer<S>(this, desc);
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
Object.freeze(OfflineGame);
Object.freeze(OfflineGame.prototype);
