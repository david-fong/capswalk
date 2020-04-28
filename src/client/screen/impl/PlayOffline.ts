import { OmHooks } from "defs/OmHooks";
import type { OfflineGame } from "../../game/OfflineGame";

import { __PlayScreen } from "./__Play";


/**
 *
 */
export class PlayOfflineScreen extends __PlayScreen {

    declare public readonly currentGame: OfflineGame<any> | undefined;

    protected __lazyLoad(): void {
        super.__lazyLoad();
    }

    protected async createNewGame(): Promise<OfflineGame<any>> {
        return await ;
    }

    protected destroyCurrentGame(): void {
        super.destroyCurrentGame();
    }

}
Object.freeze(PlayOfflineScreen);
Object.freeze(PlayOfflineScreen.prototype);
