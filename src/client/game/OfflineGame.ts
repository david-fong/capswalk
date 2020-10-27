import {
    JsUtils,
    Game,
    Coord, VisibleTile,
    BrowserGameMixin,
    // Player, OperatorPlayer,
    VisiblePlayerStatus,
} from "./BrowserGame";

import { GamepartManager } from "game/gameparts/GamepartManager";


type G = Game.Type.OFFLINE;

/**
 *
 */
export class OfflineGame<S extends Coord.System>
extends GamepartManager<G,S> implements BrowserGameMixin<G,S> {

    /**
     * @override
     */
    // @ts-expect-error : Redeclaring accessor as property.
    declare public currentOperator: NonNullable<GamepartManager<G,S>["currentOperator"]>;

    /**
     * @override
     */
    declare public htmlElements: BrowserGameMixin.HtmlElements;

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
        this._ctorBrowserGame();
    }

    /**
     * @override
     */
    declare protected readonly _getGridImplementation: BrowserGameMixin<G,S>["_getGridImplementation"];

    /**
     * @override
     */
    declare public readonly _createArtifPlayer: GamepartManager<G,S>["_createArtifPlayer"];

    /**
     * @override
     */
    public setTimeout(callback: TimerHandler, millis: number, ...args: any[]): number {
        return setTimeout(callback, millis, args);
    }

    /**
     * @override
     */
    public cancelTimeout(handle: number): void {
        clearTimeout(handle);
    }

    /**
     * @override
     */
    // NOTE: We need to declare this for OfflineGame
    // to be able to use this Mixin for some reason...
    declare public readonly processBubbleRequest: GamepartManager<G,S>["processBubbleRequest"];
}
export interface OfflineGame<S extends Coord.System> extends BrowserGameMixin<G,S> {};
JsUtils.applyMixins(OfflineGame, [BrowserGameMixin]);
Object.freeze(OfflineGame);
Object.freeze(OfflineGame.prototype);