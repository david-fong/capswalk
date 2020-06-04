import { OmHooks, SkScreen } from "../SkScreen";
import { _SetupScreen } from "./Setup";
type SID = SkScreen.Id.SETUP_ONLINE;


/**
 *
 */
export class SetupOnlineScreen extends _SetupScreen<SID> {

    public get initialScreen(): SkScreen.Id {
        return SkScreen.Id.GROUP_JOINER;
    }

    /**
     * @override
     */
    protected _lazyLoad(): void {
        super._lazyLoad();

        this.nextBtn.onclick = (ev) => {
            // TODO.design create ctorArgs from user presets.
            const ctorArgs = Object.assign({}, _SetupScreen.DEFAULT_PRESET);
            (ctorArgs.langId as string) = this.langSel.confirmedOpt.desc.id;
            this.requestGoToScreen(SkScreen.Id.GROUP_LOBBY, ctorArgs);
        };
    }

    /**
     * @override
     */
    protected _abstractOnBeforeEnter(args: SkScreen.CtorArgs<SID>): Promise<void> {
        return Promise.resolve();
    }
}
Object.freeze(SetupOnlineScreen);
Object.freeze(SetupOnlineScreen.prototype);
