import { OmHooks, SkScreen } from "../SkScreen";

import { SetupScreen } from "./Setup";


type SID = SkScreen.Id.SETUP_ONLINE;

/**
 *
 */
export class SetupOnlineScreen extends SetupScreen<SID> {

    public get initialScreen(): SkScreen.Id {
        return SkScreen.Id.GROUP_JOINER;
    }

    protected _lazyLoad(): void {
        super._lazyLoad();
        this.baseElem.classList.add(OmHooks.Screen.Impl.SetupOffline.Class.BASE);

        this.nextBtn.onclick = (ev) => {
            // TODO.design create ctorArgs from user presets.
            const ctorArgs = Object.assign({}, SetupScreen.DEFAULT_PRESET);
            (ctorArgs.langId as string) = this.langSel.confirmedOpt.desc.id;
            this.requestGoToScreen(SkScreen.Id.GROUP_LOBBY, ctorArgs);
        };
    }

    protected _abstractOnBeforeEnter(args: SkScreen.CtorArgs<SID>): Promise<void> {
        this.nextBtn.onclick = (ev) => {
            // TODO.design create ctorArgs from user presets.
            const ctorArgs = Object.assign({}, SetupScreen.DEFAULT_PRESET);
            (ctorArgs.langId as string) = this.langSel.confirmedOpt.desc.id;
            this.requestGoToScreen(SkScreen.Id.PLAY_OFFLINE, ctorArgs);
        };
        return Promise.resolve();
    }
}
Object.freeze(SetupOnlineScreen);
Object.freeze(SetupOnlineScreen.prototype);
