import { OmHooks, SkScreen } from "../SkScreen";
import { _SetupScreen } from "./Setup";


type SID = SkScreen.Id.SETUP_OFFLINE;

/**
 *
 */
export class SetupOfflineScreen extends _SetupScreen<SID> {

    protected _lazyLoad(): void {
        super._lazyLoad();

        this.nav.next.onclick = (ev) => {
            const args = this._parseArgsFromGui();
            this.requestGoToScreen(SkScreen.Id.PLAY_OFFLINE, args);
        };
    }

    protected _abstractOnBeforeEnter(args: SkScreen.EntranceArgs[SID]): Promise<void> {
        return super._abstractOnBeforeEnter(args);
    }
}
export namespace SetupOfflineScreen {
}
Object.freeze(SetupOfflineScreen);
Object.freeze(SetupOfflineScreen.prototype);