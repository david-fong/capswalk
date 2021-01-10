import type { Player } from "game/player/Player";
import type { Game } from "game/Game";

import { JsUtils, OmHooks, Coord, SkScreen } from "../../SkScreen";
import { _SetupScreen } from "./_Screen";


type SID = SkScreen.Id.SETUP_OFFLINE;

/**
 *
 */
export class SetupOfflineScreen extends _SetupScreen<SID> {

	protected _lazyLoad(): void {
		super._lazyLoad();

		this.nav.next.onclick = (ev) => {
			const args = this.parseArgsFromGui();
			this.requestGoToScreen(SkScreen.Id.PLAY_OFFLINE, [args]);
		};
	}

	/** @override */
	protected parseArgsFromGui(): Game.CtorArgs.UnFin {
		type PArgs = Array<Player.CtorArgs.UnFin>;
		const args = super.parseArgsFromGui();
		// TODO.impl get rid of this placeholder once this screen has inputs for
		// the client to configure their own players.
		(args.players as PArgs).splice(args.players.length, 0, {
			familyId:   "HUMAN",
			teamId:     0,
			clientId:   undefined,
			username:   "hello1",
			familyArgs: { },
		}, {
			familyId:   "HUMAN",
			teamId:     1,
			clientId:   undefined,
			username:   "hello2",
			familyArgs: { },
		});
		return args;
	}
}
export namespace SetupOfflineScreen {
}
Object.freeze(SetupOfflineScreen);
Object.freeze(SetupOfflineScreen.prototype);