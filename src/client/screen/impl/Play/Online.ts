import { GameEv } from "defs/OnlineDefs";
import type { Coord } from "floor/Tile";
import type { JsUtils, BaseScreen } from "../../BaseScreen";
import type { OnlineGame } from "client/game/OnlineGame";
import { Game, _PlayScreen } from "./_Screen";

/**
 * @final
 */
export class PlayOnlineScreen extends _PlayScreen<BaseScreen.Id.PLAY_ONLINE> {
	/** @override */
	protected readonly askConfirmBeforeLeave = false;

	/** @override */
	// @ts-expect-error : Redeclaring accessor as property.
	declare protected readonly currentGame: OnlineGame;

	/** @override */
	protected readonly wantsAutoPlayPause = false;

	readonly #socketMessageCb: (ev: MessageEvent<string>) => void;
	private get socket(): WebSocket {
		return this.top.socket!;
	}

	/** @override */
	protected _lazyLoad(): void {
		super._lazyLoad();
		Object.freeze(this); //🧊
		this.nav.prev.innerHTML = "Return To&nbsp;Lobby";

		// @ts-expect-error : RO=
		this.#socketMessageCb = (ev: MessageEvent<string>) => {
			const [evName, ...body] = JSON.parse(ev.data) as [string, ...any[]];
			switch (evName) {
				case GameEv.UNPAUSE: this._statusBecomePlaying(); break;
				case GameEv.PAUSE:   this._statusBecomePaused(); break;
				case GameEv.RETURN_TO_LOBBY:
					if (body[0] === undefined) {
						// Everyone is being sent back to the lobby:
						// this.currentGame.statusBecomeOver(); <- This is handled by `super._onBeforeLeave`.
						this.nav.prev.click();
					} else {
						// Handle a player leaving:
					}
					break;
				default: this.currentGame.socketMessageCb(ev);
			}
		};
		Object.seal(this); //🧊
	}

	/** @override */
	protected _abstractOnBeforeLeave(navDir: BaseScreen.NavDir): boolean {
		const leaveConfirmed = super._abstractOnBeforeLeave(navDir);
		if (leaveConfirmed) {
			if (this.socket !== undefined) {
				// This may not be entered if the server went down unexpectedly.
				this.socket.send(JSON.stringify([GameEv.RETURN_TO_LOBBY]));
				this.socket.removeEventListener("message", this.#socketMessageCb);
			}
		}
		return leaveConfirmed;
	}

	/** @override */
	protected _reqStatusPlaying(): void {
		this.socket.send(JSON.stringify([GameEv.UNPAUSE]));
	}

	/** @override */
	protected _reqStatusPaused(): void {
		this.socket.send(JSON.stringify([GameEv.PAUSE]));
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
			this.top.socket!,
			this._onGameBecomeOver.bind(this),
			ctorArgs,
			operatorIds,
		);
		this.socket.addEventListener("message", this.#socketMessageCb);
		return Promise.resolve(game);
	}
}
Object.freeze(PlayOnlineScreen);
Object.freeze(PlayOnlineScreen.prototype);