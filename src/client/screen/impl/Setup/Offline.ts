import { Player } from "game/player/Player";
import type { Game } from "game/Game";

import { BaseScreen } from "../../BaseScreen";
import { _SetupScreen } from "./_Screen";

type SID = BaseScreen.Id.SETUP_OFFLINE;

/** */
export class SetupOfflineScreen extends _SetupScreen<SID> {

	protected _abstractLazyLoad(): void {
		super._abstractLazyLoad();
		Object.freeze(this); //🧊

		this.nav.next.onclick = (ev) => {
			const args = this.parseArgsFromGui();
			this.requestGoToScreen(BaseScreen.Id.PLAY_OFFLINE, [args]);
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
			socket:     undefined,
			username:   "hello1",
			avatar:     Player.Avatar.GET_RANDOM(),
			familyArgs: { },
		}, {
			familyId:   "HUMAN",
			teamId:     1,
			socket:     undefined,
			username:   "hello2",
			avatar:     Player.Avatar.GET_RANDOM(),
			familyArgs: { },
		});
		return args;
	}
}
Object.freeze(SetupOfflineScreen);
Object.freeze(SetupOfflineScreen.prototype);