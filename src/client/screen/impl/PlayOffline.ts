import { Game } from "game/Game";
import type { OfflineGame } from "../../game/OfflineGame";

import { SkScreen } from "../SkScreen";
import { _PlayScreen as _PlayScreen } from "./Play";


type G = Game.Type.OFFLINE;

/**
 *
 */
export class PlayOfflineScreen extends _PlayScreen<SkScreen.Id.PLAY_OFFLINE, G> {

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
    protected _lazyLoad(): void {
        super._lazyLoad();
    }

    /**
     * @override
     */
    protected async _createNewGame(ctorArgs: Game.CtorArgs<G,any>): Promise<OfflineGame<any>> {
        // TODO.impl use game-setup args passed in from _abstractOnBeforeEnter
        return new (await import(
            /* webpackChunkName: "game/offline" */
            "../../game/OfflineGame"
        )).OfflineGame(this._onGameBecomeOver.bind(this), ctorArgs);
    }
}
Object.freeze(PlayOfflineScreen);
Object.freeze(PlayOfflineScreen.prototype);
