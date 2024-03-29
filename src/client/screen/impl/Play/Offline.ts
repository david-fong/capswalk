import type { Coord } from ":floor/Tile";
import type { BaseScreen } from "../../BaseScreen";
import type { OfflineGame } from "::game/OfflineGame";
import { Game, _PlayScreen } from "./_Screen";

/**
 */
export class PlayOfflineScreen extends _PlayScreen<BaseScreen.Id.PLAY_OFFLINE> {

	/** @override */
	// @ts-expect-error : Redeclaring accessor as property.
	declare protected readonly currentGame: OfflineGame<any>;

	protected override readonly _wantsAutoPlayPause = false;

	protected override readonly _askConfirmBeforeLeave = true;

	protected override _abstractLazyLoad(): void {
		super._abstractLazyLoad();
		Object.freeze(this); //🧊
		this.nav.prev.innerHTML = "Back&nbsp;To Setup";
		// ^Prevent jank due to pointer hover animation.
	}

	protected override async _createNewGame<S extends Coord.System>(args: [
		ctorArgs: Game.CtorArgs<S>,
	]): Promise<OfflineGame<S>> {
		return new (await import(
			/* webpackChunkName: "game/offline" */
			"::game/OfflineGame"
		)).OfflineGame(this._onGameBecomeOver.bind(this), args[0]);
	}
}
Object.freeze(PlayOfflineScreen);
Object.freeze(PlayOfflineScreen.prototype);