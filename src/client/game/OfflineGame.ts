import { Game } from "game/Game";

import type { Coord }           from "floor/Tile";
import { VisibleTile }          from "floor/VisibleTile";
import { VisibleGrid }          from "floor/VisibleGrid";

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
 *
 * @extends Game
 */
export class OfflineGame<S extends Coord.System> extends GameManager<G,S> {

    declare public readonly currentOperator: NonNullable<GameManager<G,S>["currentOperator"]>;

    /**
     * @override
     */
    protected __getGridImplementation(coordSys: S): VisibleGrid.ClassIf<S> {
        return VisibleGrid.getImplementation(coordSys);
    }

    /**
     * _Does not call reset._
     *
     * @param gameDesc -
     */
    public constructor(
        htmlHosts: Game.HtmlHosts,
        gameDesc: Game.CtorArgs<G,S>,
    ) {
        super(
            Game.Type.OFFLINE, {
            tileClass: VisibleTile,
            htmlHosts,
            playerStatusCtor: VisiblePlayerStatus,
            }, gameDesc,
        );

        // =====================================
        // CALL TO RESET
        this.reset();
        // =====================================
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
