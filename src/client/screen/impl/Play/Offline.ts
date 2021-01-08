import type { OfflineGame } from "client/game/OfflineGame";

import { JsUtils, OmHooks } from "../../SkScreen";
import type { SkScreen } from "../../SkScreen";
import { Game, _PlayScreen } from "./_Screen";
type G = Game.Type.OFFLINE;

/**
 */
export class PlayOfflineScreen extends _PlayScreen<SkScreen.Id.PLAY_OFFLINE, G> {

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
	protected async _createNewGame(ctorArgs: Game.CtorArgs<G,any>): Promise<OfflineGame<any>> {
		return new (await import(
			/* webpackChunkName: "game/offline" */
			"../../../game/OfflineGame"
		)).OfflineGame(this._onGameBecomeOver.bind(this), ctorArgs);
	}
}
Object.freeze(PlayOfflineScreen);
Object.freeze(PlayOfflineScreen.prototype);