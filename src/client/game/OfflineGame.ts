// Tell WebPack about the CSS chunk we want:
require("assets/style/game/index.css");

import {
    applyMixins,
    Game,
    Coord, VisibleTile, VisibleGrid,
    BrowserGameMixin,
    Player, OperatorPlayer, VisiblePlayerStatus,
} from "./BrowserGame";
import { ArtificialPlayer } from "game/player/ArtificialPlayer";

import { GameManager } from "game/__gameparts/Manager";


type G = Game.Type.OFFLINE;

/**
 *
 */
export class OfflineGame<S extends Coord.System>
extends GameManager<G,S> implements BrowserGameMixin<G,S> {

    declare public currentOperator: NonNullable<GameManager<G,S>["currentOperator"]>;

    public htmlElements: BrowserGameMixin.HtmlElements;

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
        onGameBecomeOver: () => void,
        gameDesc: Game.CtorArgs<G,S>,
    ) {
        super(
            Game.Type.OFFLINE, {
            onGameBecomeOver,
            tileClass: VisibleTile,
            playerStatusCtor: VisiblePlayerStatus,
            }, gameDesc,
        );
        this.__BrowserGame_Ctor();
    }

    declare public readonly __createArtifPlayer: GameManager<G,S>["__createArtifPlayer"];

    public setTimeout(callback: TimerHandler, millis: number, ...args: any[]): number {
        return setTimeout(callback, millis, args);
    }

    public cancelTimeout(handle: number): void {
        clearTimeout(handle);
    }

    // NOTE: We need to declare this for OfflineGame
    // to be able to use this Mixin for some reason...
    declare public readonly processBubbleRequest: GameManager<G,S>["processBubbleRequest"];
}
export interface OfflineGame<S extends Coord.System> extends BrowserGameMixin<G,S> {};
applyMixins(OfflineGame, [BrowserGameMixin,]);
Object.freeze(OfflineGame);
Object.freeze(OfflineGame.prototype);
