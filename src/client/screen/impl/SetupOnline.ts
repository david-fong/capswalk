import { OmHooks, SkScreen } from "../SkScreen";
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

        this._nextBtn.onclick = (ev) => {
            const args = this._parseArgsFromGui();
            this.requestGoToScreen(SkScreen.Id.GROUP_LOBBY, {});
        };
        this._prevBtn.onclick = (ev) => {
            this.requestGoToScreen(SkScreen.Id.GROUP_JOINER, {});
        };
    }

    /**
     * @override
     */
    protected _abstractOnBeforeEnter(args: SkScreen.EntranceArgs<SID>): Promise<void> {
        return super._abstractOnBeforeEnter(args);
    }
}
Object.freeze(SetupOnlineScreen);
Object.freeze(SetupOnlineScreen.prototype);
