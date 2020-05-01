import { OmHooks } from "defs/OmHooks";
import type { Coord }       from "floor/Tile";
import type { OnlineGame } from "../../game/OnlineGame";

import { __PlayScreen } from "./__Play";


/**
 *
 */
export class PlayOnlineScreen extends __PlayScreen {

    declare public readonly currentGame: OnlineGame<any> | undefined;

    protected readonly autoUnpauseOnRestart = false;

    protected __lazyLoad(): void {
        super.__lazyLoad();
    }

    protected async __createNewGame(): Promise<OnlineGame<any>> {
        return undefined!;
    }

}
Object.freeze(PlayOnlineScreen);
Object.freeze(PlayOnlineScreen.prototype);
