import { OmHooks } from "defs/OmHooks";
import type { Coord } from "floor/Tile";
import type { OnlineGame } from "../../game/OnlineGame";

import type { SkScreen } from "../SkScreen";
import { __PlayScreen } from "./Play";


/**
 *
 */
export class PlayOnlineScreen extends __PlayScreen<SkScreen.Id.PLAY_ONLINE> {

    declare public readonly currentGame: OnlineGame<any> | undefined;

    /**
     * @override
     */
    protected readonly wantsAutoPause = false;

    /**
     * @override
     */
    protected __lazyLoad(): void {
        super.__lazyLoad();
    }

    /**
     * @override
     */
    protected async __createNewGame(): Promise<OnlineGame<any>> {
        return new (await import(
            /* webpackChunkName: "game/online" */
            "../../game/OnlineGame"
        )).OnlineGame(this.toplevel.socket!, undefined!);
    }
}
export namespace PlayOnlineScreen {
}
Object.freeze(PlayOnlineScreen);
Object.freeze(PlayOnlineScreen.prototype);
