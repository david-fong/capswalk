import { GroupEv } from "defs/OnlineDefs";

import type { BaseScreen } from "../../BaseScreen";
import { _SetupScreen } from "./_Screen";

type SID = BaseScreen.Id.SETUP_ONLINE;

/** */
export class SetupOnlineScreen extends _SetupScreen<SID> {

	/** @override */
	protected _lazyLoad(): void {
		super._lazyLoad();
		Object.freeze(this); //🧊

		this.nav.next.textContent = "Start Game";
		this.nav.next.onclick = (ev) => {
			const args = this.parseArgsFromGui();
			if (this.top.clientIsGroupHost) {
				this.top.webSocket!.send(JSON.stringify([GroupEv.CREATE_GAME, args]));
			}
		};
	}
}
Object.freeze(SetupOnlineScreen);
Object.freeze(SetupOnlineScreen.prototype);