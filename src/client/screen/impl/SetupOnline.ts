import { GroupEv } from "defs/OnlineDefs";
import { Game } from "game/Game";

import { JsUtils, OmHooks, SkScreen } from "../SkScreen";
import { _SetupScreen } from "./Setup";
type SID = SkScreen.Id.SETUP_ONLINE;


/**
 *
 */
export class SetupOnlineScreen extends _SetupScreen<SID> {

    /**
     * @override
     */
    public get initialScreen(): SkScreen.Id {
        return SkScreen.Id.GROUP_JOINER;
    }

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