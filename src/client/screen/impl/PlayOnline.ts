import { OmHooks } from "defs/OmHooks";
import type { OnlineGame } from "../../game/OnlineGame";

import { __PlayScreen } from "./__Play";


/**
 *
 */
export class PlayOnlineScreen extends __PlayScreen {

    declare public readonly currentGame: OnlineGame<any> | undefined;

    protected __lazyLoad(): void {
        super.__lazyLoad();
    }

    protected async createNewGame(): Promise<OnlineGame<any>> {
        return undefined!;
    }

    protected destroyCurrentGame(): void {
        super.destroyCurrentGame();
    }

}
Object.freeze(PlayOnlineScreen);
Object.freeze(PlayOnlineScreen.prototype);
