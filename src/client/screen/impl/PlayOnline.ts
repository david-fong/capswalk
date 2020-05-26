import { OmHooks } from "defs/OmHooks";
import { Game } from 'game/Game';
import type { Coord } from "floor/Tile";
import type { OnlineGame } from "../../game/OnlineGame";

import type { SkScreen } from "../SkScreen";
import { __PlayScreen } from "./Play";


/**
 *
 */
export class PlayOnlineScreen extends __PlayScreen<SkScreen.Id.PLAY_ONLINE> {

    public readonly canBeInitialScreen = false;

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
        type G = Game.Type.ONLINE;
        return new Promise((resolve, reject): void => {
            // TODO.design should we use `.on` or `.once`?
            this.toplevel.socket!.on(Game.CtorArgs.EVENT_NAME, async (gameCtorArgs: Game.CtorArgs<G,any>) => {
                const game = new (await import(
                    /* webpackChunkName: "game/online" */
                    "../../game/OnlineGame"
                )).OnlineGame(
                    this.__onGameBecomeOver.bind(this),
                    this.toplevel.socket!,
                    gameCtorArgs,
                );
                resolve(game);
            })
        });
    }
}
export namespace PlayOnlineScreen {
}
Object.freeze(PlayOnlineScreen);
Object.freeze(PlayOnlineScreen.prototype);
