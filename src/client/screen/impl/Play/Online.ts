import type { Socket } from "socket.io-client";
import { JsUtils, OmHooks } from "../../BaseScreen";

import { GameEv } from "defs/OnlineDefs";
import type { Coord } from "floor/Tile";
import type { BaseScreen } from "../../BaseScreen";
import type { OnlineGame } from "client/game/OnlineGame";
import { Game, _PlayScreen } from "./_Screen";

/**
 */
export class PlayOnlineScreen extends _PlayScreen<BaseScreen.Id.PLAY_ONLINE> {
	/** @override */
	protected readonly askConfirmBeforeLeave = false;

	/** @override */
	// @ts-expect-error : Redeclaring accessor as property.
	declare protected readonly currentGame: OnlineGame;

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
	protected _abstractOnBeforeLeave(navDir: BaseScreen.NavDir): boolean {
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
	protected async _createNewGame<S extends Coord.System>(args: [
		ctorArgs: Game.CtorArgs<S>,
		operatorIds: readonly number[],
	]): Promise<OnlineGame<S>> {
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