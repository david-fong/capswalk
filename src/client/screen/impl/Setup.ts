import { Lang } from "defs/TypeDefs";
import { Coord } from "floor/Tile";
import type { Game } from "game/Game";
import { SkPickOne } from "../../utils/SkPickOne";

import { OmHooks, SkScreen } from "../SkScreen";


type SID_options = SkScreen.Id.SETUP_OFFLINE | SkScreen.Id.SETUP_ONLINE;

/**
 * What coordinate systems are available will depend on what language
 * the user chooses.
 */
// TODO.learn how to use the IndexDB web API.
export abstract class _SetupScreen<SID extends SID_options> extends SkScreen<SID> {

    protected readonly langSel: _SetupScreen.LangPickOne;

    protected readonly nextBtn: HTMLButtonElement;

    /**
     * @override
     */
    protected _lazyLoad(): void {
        this.baseElem.classList.add(OmHooks.Screen.Impl.Setup.Class.BASE);

        // Language selection component:
        (this.langSel as _SetupScreen.LangPickOne) = new _SetupScreen.LangPickOne();
        this.baseElem.appendChild(this.langSel.baseElem);

        const nextBtn
            = (this.nextBtn as HTMLButtonElement)
            = document.createElement("button");
        nextBtn.classList.add(OmHooks.Screen.Impl.Setup.Class.NEXT_BUTTON);
        nextBtn.textContent = "Next";
        this.baseElem.appendChild(nextBtn);
    }
}
export namespace _SetupScreen {

    // TODO.impl If we keep this, use a recursive Object.freeze.
    // Currently not frozen to allow for easier testing.
    export const DEFAULT_PRESET = <Game.CtorArgs<Game.Type.OFFLINE,any>>{
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
            familyArgs: {
                fearDistance: 5,
                bloodThirstDistance: 7,
                healthReserve: 3.0,
                movesPerSecond: 2.0,
            },
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
                movesPerSecond: 1.8,
            },
        },],
    };
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
