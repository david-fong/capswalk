import { GameEv } from ":defs/OnlineDefs";
import type { Coord } from ":floor/Tile";
import type { BaseScreen } from "../../BaseScreen";
import type { OnlineGame } from "::game/OnlineGame";
import { Game, _PlayScreen } from "./_Screen";

/**
 * @final
 */
export class PlayOnlineScreen extends _PlayScreen<BaseScreen.Id.PLAY_ONLINE> {

	protected override readonly _askConfirmBeforeLeave = false;

	/** @override */
	// @ts-expect-error : Redeclaring accessor as property.
	declare protected readonly currentGame: OnlineGame;

	protected override readonly _wantsAutoPlayPause = false;

	readonly #wsMessageCb: (ev: MessageEvent<string>) => void;
	private get ws(): WebSocket {
		return this.top.webSocket!;
	}

	protected override _abstractLazyLoad(): void {
		super._abstractLazyLoad();
		Object.freeze(this); //🧊
		this.nav.prev.innerHTML = "Back&nbsp;To Lobby";

		// @ts-expect-error : RO=
		this.#wsMessageCb = (ev: MessageEvent<string>) => {
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
				default: this.currentGame.wsMessageCb(ev);
			}
		};
		Object.seal(this); //🧊
	}

	protected override _abstractOnBeforeLeave(navDir: BaseScreen.NavDir): boolean {
		const leaveConfirmed = super._abstractOnBeforeLeave(navDir);
		if (leaveConfirmed) {
			if (this.ws !== undefined) {
				// This may not be entered if the server went down unexpectedly.
				this.ws.send(JSON.stringify([GameEv.RETURN_TO_LOBBY]));
				this.ws.removeEventListener("message", this.#wsMessageCb);
			}
		}
		return leaveConfirmed;
	}

	protected override _reqStatusPlaying(): void {
		this.ws.send(JSON.stringify([GameEv.UNPAUSE]));
	}

	protected override _reqStatusPaused(): void {
		this.ws.send(JSON.stringify([GameEv.PAUSE]));
	}

	protected override async _createNewGame<S extends Coord.System>(args: [
		ctorArgs: Game.CtorArgs<S>,
		clientPlayerIds: readonly number[],
	]): Promise<OnlineGame<S>> {
		const [ctorArgs, clientPlayerIds] = args;
		const game = new (await import(
			/* webpackChunkName: "game/online" */
			"::game/OnlineGame"
		)).OnlineGame(
			this.top.webSocket!,
			this._onGameBecomeOver.bind(this),
			ctorArgs,
			clientPlayerIds,
		);
		this.ws.addEventListener("message", this.#wsMessageCb);
		return Promise.resolve(game);
	}
}
Object.freeze(PlayOnlineScreen);
Object.freeze(PlayOnlineScreen.prototype);