import type { OnlineGame } from "../../game/OnlineGame";

import { Coord, SkScreen } from "../SkScreen";
import { Game, _PlayScreen } from "./Play";
type SID = SkScreen.Id.PLAY_ONLINE;
type G = Game.Type.ONLINE;


/**
 *
 */
export class PlayOnlineScreen extends _PlayScreen<SID, G> {
    /**
     * @override
     */
    protected readonly askConfirmBeforeLeave = false;

    /**
     * @override
     */
    public get initialScreen(): SkScreen.Id {
        return SkScreen.Id.GROUP_JOINER;
    };
    /**
     * @override
     */
    public getNavPrevArgs(): SkScreen.NavPrevRet<SkScreen.Id.GROUP_LOBBY> {
        return [SkScreen.Id.GROUP_LOBBY, {}, SkScreen.NavDir.BACKWARD,];
    };

    /**
     * @override
     */
    // @ts-expect-error : Redeclaring accessor as property.
    declare public readonly currentGame: OnlineGame<Coord.System> | undefined;

    /**
     * @override
     */
    protected readonly wantsAutoPause = false;

    /**
     * @override
     */
    protected _lazyLoad(): void {
        super._lazyLoad();
        this.nav.prev.textContent = "Return To Lobby";
    }

    protected async _abstractOnBeforeEnter(navDir: SkScreen.NavDir, args: SkScreen.EntranceArgs[SID]): Promise<void> {
        if (this.top.clientIsGroupHost) {
            (this.nav.prev as HTMLButtonElement).onclick = (ev) => {
                // TODO.impl ask first.
                this.top.socket!.emit(Game.CtorArgs.EVENT_NAME, Game.CtorArgs.RETURN_TO_LOBBY_INDICATOR);
            };
        } else {
            // TODO.impl leave the game but stay in the group.
        }
    }

    /**
     * @override
     */
    protected async _createNewGame(ctorArgs: Game.CtorArgs<G,Coord.System>): Promise<OnlineGame<Coord.System>> {
        const game = new (await import(
            /* webpackChunkName: "game/online" */
            "../../game/OnlineGame"
        )).OnlineGame(
            this._onGameBecomeOver.bind(this),
            this.top.socket!,
            ctorArgs,
        );
        return Promise.resolve(game);
    }
}
export namespace PlayOnlineScreen {
}
Object.freeze(PlayOnlineScreen);
Object.freeze(PlayOnlineScreen.prototype);