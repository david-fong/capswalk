import { Lang } from "defs/TypeDefs";
import { Coord } from "floor/Tile";
import type { Game } from "game/Game";
import { SkPickOne } from "../../utils/SkPickOne";

import { OmHooks, StorageHooks, SkScreen } from "../SkScreen";
const OMHC = OmHooks.Screen.Impl.Setup.Class;


type SID_options = SkScreen.Id.SETUP_OFFLINE | SkScreen.Id.SETUP_ONLINE;

/**
 * What coordinate systems are available will depend on what language
 * the user chooses.
 *
 * Implementation Note: subclasses must implement the `onClick`
 * behaviour of the `_nextBtn` and `_prevBtn` buttons.
 */
// TODO.learn how to use the IndexDB web API.
export abstract class _SetupScreen<SID extends SID_options> extends SkScreen<SID> {

    protected readonly langSel: _SetupScreen.LangPickOne;
    protected readonly langWeightExaggeration: HTMLInputElement;

    /**
     * @override
     */
    protected _lazyLoad(): void {
        this.baseElem.classList.add(OMHC.BASE);

        // Language selection component:
        (this.langSel as _SetupScreen.LangPickOne) = new _SetupScreen.LangPickOne();
        this.baseElem.appendChild(this.langSel.baseElem);

        this._createLangWeightExaggerationInput();

        {const prev = this.nav.prev;
        prev.classList.add(OMHC.PREV_BUTTON);
        prev.textContent = "Prev";
        this.baseElem.appendChild(prev);
        }
        {const next = this.nav.next;
        next.classList.add(OMHC.NEXT_BUTTON);
        next.textContent = "Next";
        this.baseElem.appendChild(next);
        }

        this._loadLastUsedPreset();
    }

    private _createLangWeightExaggerationInput(): void {
        const lwe
            = (this.langWeightExaggeration as HTMLInputElement)
            = document.createElement("input");
        lwe.classList.add(OMHC.LANG_WEIGHT_EXAGG);
        lwe.type = "range";
        lwe.min = "0";
        lwe.max = Lang.WeightExaggeration.MAX.toString();
        lwe.step = "any";
        lwe.value = "1";
        {
            const list = document.createElement("datalist");
            list.id = OmHooks.Screen.Impl.Setup.Id.LANG_WEIGHT_EXAGGERATION_LIST;
            [{val:0,label:"0",}, {val:1,label:"1"},].forEach((tickDesc) => {
                const opt = document.createElement("option");
                opt.value = tickDesc.val.toString();
                opt.label = tickDesc.label;
                list.appendChild(opt);
            });
            this.baseElem.appendChild(list);
        }
        lwe.setAttribute("list", OmHooks.Screen.Impl.Setup.Id.LANG_WEIGHT_EXAGGERATION_LIST);
        this.baseElem.appendChild(lwe);
    }

    /**
     * @override
     */
    protected async _abstractOnBeforeEnter(args: SkScreen.EntranceArgs[SID]): Promise<void> {
        window.setTimeout(() => {
            this.nav.next.focus();
        }, 100); // <-- An arbitrary short period of time. See super doc.
        return;
    }

    /**
     * Load the user's last used preset to the gui controls.
     */
    private _loadLastUsedPreset(): void {
        // TODO.impl
        const lastUsedPresetId = localStorage.getItem(StorageHooks.LocalKeys.GAME_PRESET);
    }

    /**
     * A helper for going to the next screen.
     */
    protected _parseArgsFromGui(): Game.CtorArgs<Game.Type.OFFLINE,Coord.System> {
        // TODO.impl
        const args: TU.NoRo<Game.CtorArgs<Game.Type.OFFLINE,Coord.System>>
            = Object.assign({}, _SetupScreen.DEFAULT_PRESET);
            // ^temporary default until _loadLastUsedPreset is implemented.
        args.langId = this.langSel.confirmedOpt.desc.id;
        args.langWeightScaling = Number(this.langWeightExaggeration.value);
        return args;
    }
}
export namespace _SetupScreen {

    // TODO.impl If we keep this, use a recursive Object.freeze.
    // Currently not frozen to allow for easier testing.
    export const DEFAULT_PRESET = <Game.CtorArgs<Game.Type.OFFLINE,Coord.System>>{
        coordSys: Coord.System.EUCLID2,
        gridDimensions: {
            height: 21,
            width:  21,
        },
        averageFreeHealthPerTile: 1.0 / 45.0,
        langWeightScaling: 1.0,
        langId: "engl-low",
        playerDescs: [{
            isALocalOperator: true,
            familyId:   <const>"HUMAN",
            teamId:     0,
            socketId:   undefined,
            username:   "hello1",
            noCheckGameOver: false,
            familyArgs: { },
        }, {
            isALocalOperator: true,
            familyId:   <const>"HUMAN",
            teamId:     1,
            socketId:   undefined,
            username:   "hello2",
            noCheckGameOver: false,
            familyArgs: { },
        }, {
            isALocalOperator: false,
            familyId:   <const>"CHASER",
            teamId:     1,
            socketId:   undefined,
            username:   "chaser1",
            noCheckGameOver: true,
            familyArgs: {/* Uses all defaults. */},
        }, {
            isALocalOperator: false,
            familyId:   <const>"CHASER",
            teamId:     1,
            socketId:   undefined,
            username:   "chaser2",
            noCheckGameOver: true,
            familyArgs: {
                fearDistance: 6,
                bloodThirstDistance: 5,
                healthReserve: 5.0,
                keyPressesPerSecond: 1.8,
            },
        },],
    };
    /**
     *
     */
    export class LangPickOne extends SkPickOne<LangPickOne.Option> {
        public constructor() {
            super();
            this.baseElem.classList.add(OMHC.LANG_SEL)
            Lang.FrontendDescs.forEach((desc) => {
                this.addOption(new LangPickOne.Option(desc));
            });
            this.selectOpt(this.options[0]);
        }
        public _onHoverOpt(opt: LangPickOne.Option): void {
            ;
        }
        public _onSelectOpt(opt: LangPickOne.Option): void {
            ;
        }
    }
    export namespace LangPickOne {
        /**
         *
         */
        export class Option extends SkPickOne._Option {

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
Object.freeze(_SetupScreen);
Object.freeze(_SetupScreen.prototype);