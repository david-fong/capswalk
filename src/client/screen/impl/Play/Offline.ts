import { JsUtils, OmHooks } from "../../SkScreen";
import type { Coord } from "floor/Tile";
import type { SkScreen } from "../../SkScreen";
import type { OfflineGame } from "client/game/OfflineGame";
import { Game, _PlayScreen } from "./_Screen";

/**
 */
export class PlayOfflineScreen extends _PlayScreen<SkScreen.Id.PLAY_OFFLINE,"OFFLINE"> {

	/** @override */
	// @ts-expect-error : Redeclaring accessor as property.
	declare protected readonly currentGame: OfflineGame<any>;

	/** @override */
	protected readonly wantsAutoPlayPause = true;

	/** @override */
	protected readonly askConfirmBeforeLeave = true;

	/** @override */
	protected _lazyLoad(): void {
		super._lazyLoad();
		this.nav.prev.innerHTML = "Return To&nbsp;Setup";
		// ^Prevent jank due to pointer hover animation.
	}

	/** @override */
	protected async _createNewGame<S extends Coord.System>(args: [
		ctorArgs: Game.CtorArgs<S>,
	]): Promise<OfflineGame<S>> {
		return new (await import(
			/* webpackChunkName: "game/offline" */
			"../../../game/OfflineGame"
		)).OfflineGame(this._onGameBecomeOver.bind(this), args[0]);
	}
}
Object.freeze(PlayOfflineScreen);
Object.freeze(PlayOfflineScreen.prototype);