// TODO dynamically import socket.io-client.
import type * as SocketIOClient from "socket.io-client";

import { OmHooks } from "defs/OmHooks";
import type { Coord }       from "floor/Tile";
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

    protected __lazyLoad(): void {
        super.__lazyLoad();
    }

    protected async __createNewGame(): Promise<OnlineGame<any>> {
        return undefined!;
    }
}
export namespace PlayOnlineScreen {
    export type CtorArgs = Readonly<{
        socket: typeof SocketIOClient.Socket.id;
    }>;
}
Object.freeze(PlayOnlineScreen);
Object.freeze(PlayOnlineScreen.prototype);
