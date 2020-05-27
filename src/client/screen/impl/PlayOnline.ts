import { OmHooks } from "defs/OmHooks";
import type { Game } from "game/Game";
import type { OnlineGame } from "../../game/OnlineGame";

import { SkScreen } from "../SkScreen";
import { __PlayScreen } from "./Play";


type G = Game.Type.ONLINE;

/**
 *
 */
export class PlayOnlineScreen extends __PlayScreen<SkScreen.Id.PLAY_ONLINE, G> {

    public get initialScreen(): SkScreen.Id {
        return SkScreen.Id.GROUP_JOINER;
    };

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
    protected async __createNewGame(ctorArgs: Game.CtorArgs<G,any>): Promise<OnlineGame<any>> {
        const game = new (await import(
            /* webpackChunkName: "game/online" */
            "../../game/OnlineGame"
        )).OnlineGame(
            this.__onGameBecomeOver.bind(this),
            this.toplevel.socket!,
            ctorArgs,
        );
        return Promise.resolve(game);
    }
}
export namespace PlayOnlineScreen {
}
Object.freeze(PlayOnlineScreen);
Object.freeze(PlayOnlineScreen.prototype);
