import { Game } from "game/Game";

import { SkScreen } from "../SkScreen";


type SID = SkScreen.Id.GROUP_LOBBY;

/**
 *
 */
export class GroupLobbyScreen extends SkScreen<SID> {

    public get initialScreen(): SkScreen.Id {
        return SkScreen.Id.GROUP_JOINER;
    }

    /**
     * @override
     */
    protected _lazyLoad(): void {
        ;
    }

    protected _abstractOnBeforeEnter(args: SkScreen.CtorArgs<SID>): Promise<void> {

        // Listen for when the server sends tbe game constructor arguments:
        this.toplevel.socket!.once(
            Game.CtorArgs.EVENT_NAME,
            async (gameCtorArgs: Game.CtorArgs<Game.Type.ONLINE,any>) => {
                this.requestGoToScreen(SkScreen.Id.PLAY_ONLINE, gameCtorArgs);
            },
        );
        return Promise.resolve();
    }
}
Object.freeze(GroupLobbyScreen);
Object.freeze(GroupLobbyScreen.prototype);
