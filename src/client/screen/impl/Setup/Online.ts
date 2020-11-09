import { GroupEv } from "defs/OnlineDefs";
import { Game } from "game/Game";

import { JsUtils, OmHooks } from "../../SkScreen";
import type { SkScreen } from "../../SkScreen";
import { _SetupScreen } from "./_Screen";
type SID = SkScreen.Id.SETUP_ONLINE;


/**
 *
 */
export class SetupOnlineScreen extends _SetupScreen<SID> {

    /**
     * @override
     */
    protected _lazyLoad(): void {
        super._lazyLoad();

        this.nav.next.textContent = "Start Game";
        this.nav.next.onclick = (ev) => {
            const args = this.parseArgsFromGui();
            if (this.top.clientIsGroupHost) {
                this.top.sockets.groupSocket!.emit(GroupEv.CREATE_GAME, args);
            }
        };
    }
}
Object.freeze(SetupOnlineScreen);
Object.freeze(SetupOnlineScreen.prototype);