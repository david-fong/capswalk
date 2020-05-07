import { Lang } from "defs/TypeDefs";

import { SkScreen } from "../SkScreen";


type SID_options = SkScreen.Id.SETUP_OFFLINE | SkScreen.Id.SETUP_ONLINE;

/**
 * What coordinate systems are available will depend on what language
 * the user chooses.
 */
// TODO.learn how to use the IndexDB web API.
export abstract class SetupScreen<SID extends SID_options> extends SkScreen<SID> {

    private readonly langSel: HTMLSelectElement;

    /**
     * @override
     */
    protected __lazyLoad(): void {
        this.createLangSelector();
    }

    private createLangSelector(): void {
        const langSel = document.createElement("select");
        for (const langName of Object.values(Lang.FrontendDescs)) {
            const opt = document.createElement("option");
            opt.value = langName.id;
            opt.innerText = langName.display;
            langSel.add(opt);
        }
        langSel.onchange = (): void => {
            langSel.blur();
            // TODO
        };
        // TODO.impl set defaults from last used setup.
        (this.langSel as HTMLSelectElement) = langSel;
    }
}
export namespace GameSetupScreen {
}
Object.freeze(SetupScreen);
Object.freeze(SetupScreen.prototype);
