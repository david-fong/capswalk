import type { Socket } from "socket.io-client";
import type { OnlineGame } from "client/game/OnlineGame";

import { GameEv } from "defs/OnlineDefs";
import { JsUtils, OmHooks } from "../../SkScreen";
import type { SkScreen } from "../../SkScreen";
import { Game, _PlayScreen } from "./_Screen";
type SID = SkScreen.Id.PLAY_ONLINE;
type G = Game.Type.ONLINE;


/**
 */
export class PlayOnlineScreen extends _PlayScreen<SID, G> {
	/** @override */
	protected readonly askConfirmBeforeLeave = false;

	/** @override */
	// @ts-expect-error : Redeclaring accessor as property.
	declare protected readonly currentGame: OnlineGame<any>;

	/** @override */
	protected readonly wantsAutoPlayPause = false;

	private get socket(): Socket {
		return this.top.sockets.gameSocket!;
	}

	/** @override */
	protected _lazyLoad(): void {
		super._lazyLoad();
		this.nav.prev.innerHTML = "Return To&nbsp;Lobby";
	}

	/** @override */
	protected _abstractOnBeforeLeave(navDir: SkScreen.NavDir): boolean {
		const leaveConfirmed = super._abstractOnBeforeLeave(navDir);
		if (leaveConfirmed) {
			if (this.socket !== undefined) {
				// This may not be entered if the server went down unexpectedly.
				this.socket.emit(GameEv.RETURN_TO_LOBBY);
				this.socket.offAny();
				this.socket.disconnect();
			}
		}
		return leaveConfirmed;
	}

	/** @override */
	protected _reqStatusPlaying(): void {
		this.socket.emit(GameEv.UNPAUSE);
	}

	/** @override */
	protected _reqStatusPaused(): void {
		this.socket.emit(GameEv.PAUSE);
	}

	/** @override */
	protected async _createNewGame(args: [
		ctorArgs: Game.CtorArgs,
		operatorIds: readonly number[],
	]): Promise<OnlineGame<any>> {
		const [ctorArgs, operatorIds] = args;
		const game = new (await import(
			/* webpackChunkName: "game/online" */
			"../../../game/OnlineGame"
		)).OnlineGame(
			this.top.sockets.gameSocket!,
			this._onGameBecomeOver.bind(this),
			ctorArgs,
			operatorIds,
		);
		this.socket
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
}
Object.freeze(PlayOnlineScreen);
Object.freeze(PlayOnlineScreen.prototype);