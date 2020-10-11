import type { OnlineGame } from "../../game/OnlineGame";

import { GameEv } from "defs/OnlineDefs";
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
        this.top.socket!.emit(GameEv.RETURN_TO_LOBBY);
        this.currentGame?.statusBecomeOver();
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

    private get socket(): SocketIOClient.Socket {
        return this.top.socket!;
    }

    /**
     * @override
     */
    protected _lazyLoad(): void {
        super._lazyLoad();
        this.nav.prev.innerHTML = "Return To&nbsp;Lobby";
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
            this.socket,
            ctorArgs,
        );
        this.socket.on(GameEv.UNPAUSE, () => {
            this._statusBecomePlaying();
        });
        this.socket.on(GameEv.PAUSE, () => {
            this._statusBecomePaused;
        });
        this.socket.on(GameEv.RETURN_TO_LOBBY, (socketId: string | undefined) => {
            if (socketId === undefined) {
                // Everyone is being sent back to the lobby:
                this.currentGame!.statusBecomeOver();
                this.nav.prev.click();
            } else {
                this.currentGame!.onPlayerLeave(socketId);
            }
        });
        return Promise.resolve(game);
    }

    protected _onGameBecomeOver(): void {
        this.socket.off(GameEv.UNPAUSE);
        this.socket.off(GameEv.PAUSE);
        this.socket.off(GameEv.RETURN_TO_LOBBY);
    }
}
export namespace PlayOnlineScreen {
}
Object.freeze(PlayOnlineScreen);
Object.freeze(PlayOnlineScreen.prototype);