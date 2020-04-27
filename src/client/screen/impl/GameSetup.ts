import { SkScreen } from "../SkScreen";
import { Lang } from "defs/TypeDefs";


/**
 *
 */
export class GameSetupScreen extends SkScreen {

    private readonly langSel: HTMLSelectElement;

    protected __lazyLoad(): void {
        // TODO.impl Read last used setup from localStorage.
        {
        // LANGUAGE SELECTION:
        const langSel = document.createElement("select");
        for (const langName of Object.values(Lang.Names)) {
            const opt = document.createElement("option");
            opt.value = langName.id;
            opt.innerText = langName.display;
            langSel.add(opt);
        }
        langSel.onselect = (): void => {
            langSel.blur();
            // TODO
        };
        // TODO.impl set defaults from last used setup.
        (this.langSel as HTMLSelectElement) = langSel;
    } {
        // TODO.impl
    } }

}
Object.freeze(GameSetupScreen);
Object.freeze(GameSetupScreen.prototype);
