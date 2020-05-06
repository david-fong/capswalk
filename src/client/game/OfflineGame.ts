// Tell WebPack about the CSS chunk we want:
require("assets/style/game/index.css");

import { Game }                 from "game/Game";
import type { Coord }           from "floor/Tile";
import { VisibleTile }          from "floor/VisibleTile";
import { VisibleGrid }          from "floor/VisibleGrid";
import { VisibleGame }          from "./VisibleGame";

import type { Player }          from "game/player/Player";
import { OperatorPlayer }       from "game/player/OperatorPlayer";
import { VisiblePlayerStatus }  from "game/player/VisiblePlayerStatus";
import { ArtificialPlayer }     from "game/player/ArtificialPlayer";

import { GameManager } from "game/__gameparts/Manager";

import { IndexTasks } from "game/IndexTasks";
IndexTasks.INIT_CLASS_REGISTRIES();


type G = Game.Type.OFFLINE;

/**
 *
 */
export class OfflineGame<S extends Coord.System>
extends GameManager<G,S> implements VisibleGame {

    declare public currentOperator: NonNullable<GameManager<G,S>["currentOperator"]>;

    public htmlElements: VisibleGame["htmlElements"];

    /**
     * @override
     */
    protected __getGridImplementation(coordSys: S): VisibleGrid.ClassIf<S> {
        return VisibleGrid.getImplementation(coordSys);
    }

    /**
     * @param gameDesc -
     */
    public constructor(
        gameDesc: Game.CtorArgs<G,S>,
    ) {
        super(
            Game.Type.OFFLINE, {
            tileClass: VisibleTile,
            playerStatusCtor: VisiblePlayerStatus,
            }, gameDesc,
        );
        this.htmlElements = Object.freeze(<VisibleGame["htmlElements"]>{
            gridImplElem: this.grid.baseElem,
        });
    }

    protected __createOperatorPlayer(desc: Player.__CtorArgs<"HUMAN">): OperatorPlayer<S> {
        return new OperatorPlayer<S>(this, desc);
    }

    protected __createArtifPlayer(desc: Player.__CtorArgs<Player.FamilyArtificial>): ArtificialPlayer<S> {
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
