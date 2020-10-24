import type { OnlineGame } from "../../game/OnlineGame";

import { GameEv } from "defs/OnlineDefs";
import { JsUtils, Coord, SkScreen } from "../SkScreen";
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
    // @ts-expect-error : Redeclaring accessor as property.
    declare protected readonly currentGame: OnlineGame<Coord.System>;

    /**
     * @override
     */
    protected readonly wantsAutoPause = false;

    private get socket(): SocketIOClient.Socket {
        return this.currentGame.socket;
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
    protected _abstractOnBeforeLeave(navDir: SkScreen.NavDir): boolean {
        const leaveConfirmed = super._abstractOnBeforeLeave(navDir);
        if (leaveConfirmed) {
            this.socket.emit(GameEv.RETURN_TO_LOBBY);
            this.socket.close();
            if (this.socket !== undefined) {
                throw new Error("never"); // See `SkSockets._configSocket`.
            }
        }
        return leaveConfirmed;
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
            this.top.sockets.gameSocket!,
            ctorArgs,
            );
        this.top.sockets.gameSocket!
        .on(GameEv.UNPAUSE, () => {
            this._statusBecomePlaying();
        })
        .on(GameEv.PAUSE, () => {
            this._statusBecomePaused();
        })
        .on(GameEv.RETURN_TO_LOBBY, (socketId: string | undefined) => {
            if (socketId === undefined) {
                // Everyone is being sent back to the lobby:
                // this.currentGame.statusBecomeOver(); <- This is handled by `super._onBeforeLeave`.
                this.nav.prev.click();
            } else {
                // Handle a player leaving:
            }
        });
        return Promise.resolve(game);
    }

    /**
     * @override
     */
    protected _onGameBecomeOver(): void {
        super._onGameBecomeOver();
    }
}
export namespace PlayOnlineScreen {
}
Object.freeze(PlayOnlineScreen);
Object.freeze(PlayOnlineScreen.prototype);