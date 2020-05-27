import { Game } from "game/Game";
import type { OfflineGame } from "../../game/OfflineGame";

import { SkScreen } from "../SkScreen";
import { __PlayScreen } from "./Play";


type G = Game.Type.OFFLINE;

/**
 *
 */
export class PlayOfflineScreen extends __PlayScreen<SkScreen.Id.PLAY_OFFLINE, G> {

    public get initialScreen(): SkScreen.Id {
        return SkScreen.Id.SETUP_OFFLINE;
    }

    declare public readonly currentGame: OfflineGame<any> | undefined;

    /**
     * @override
     */
    protected readonly wantsAutoPause = true;

    /**
     * @override
     */
    protected __lazyLoad(): void {
        super.__lazyLoad();
    }

    /**
     * @override
     */
    protected async __createNewGame(ctorArgs: Game.CtorArgs<G,any>): Promise<OfflineGame<any>> {
        // TODO.impl use game-setup args passed in from __abstractOnBeforeEnter
        return new (await import(
            /* webpackChunkName: "game/offline" */
            "../../game/OfflineGame"
        )).OfflineGame(this.__onGameBecomeOver.bind(this), ctorArgs);
    }
}
Object.freeze(PlayOfflineScreen);
Object.freeze(PlayOfflineScreen.prototype);
