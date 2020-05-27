import { Lang } from "defs/TypeDefs";

import { SkScreen } from "../SkScreen";
import { SkPickOne } from "../../utils/SkPickOne";


type SID_options = SkScreen.Id.SETUP_OFFLINE | SkScreen.Id.SETUP_ONLINE;

/**
 * What coordinate systems are available will depend on what language
 * the user chooses.
 */
// TODO.learn how to use the IndexDB web API.
export abstract class SetupScreen<SID extends SID_options> extends SkScreen<SID> {

    protected readonly langSel: SetupScreen.LangPickOne;

    protected readonly nextBtn: HTMLButtonElement;

    /**
     * @override
     */
    protected __lazyLoad(): void {
        (this.langSel as SetupScreen.LangPickOne) = new SetupScreen.LangPickOne();
        this.baseElem.appendChild(this.langSel.baseElem);

        const nextBtn
            = (this.nextBtn as HTMLButtonElement)
            = document.createElement("button");
        nextBtn.textContent = "Next";
        this.baseElem.appendChild(nextBtn);
    }
}
export namespace SetupScreen {
    /**
     *
     */
    export class LangPickOne extends SkPickOne<LangPickOne.Option> {
        public constructor() {
            super();
            Lang.FrontendDescs.forEach((desc) => {
                this.addOption(new LangPickOne.Option(desc));
            });
            // TODO.impl set defaults from last used setup.
            // Below line is a placeholder.
            this.selectOpt(this.options[0]);
        }
        public __onHoverOpt(opt: LangPickOne.Option): void {
            ;
        }
        public __onSelectOpt(opt: LangPickOne.Option): void {
            ;
        }
    }
    export namespace LangPickOne {
        /**
         *
         */
        export class Option extends SkPickOne.__Option {

            public readonly desc: Lang.FrontendDesc;

            public constructor(desc: Lang.FrontendDesc) {
                super();
                this.desc = desc;
                this.baseElem.textContent = desc.displayName;
            }
        }
        Object.freeze(Option);
        Object.freeze(Option.prototype);
    }
}
Object.freeze(SetupScreen);
Object.freeze(SetupScreen.prototype);
