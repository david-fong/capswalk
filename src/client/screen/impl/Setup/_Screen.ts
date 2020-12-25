import { Lang, Player } from "defs/TypeDefs";
import type { Coord } from "floor/Coord";
import type { Player as _Player } from "game/player/Player";
import type { Game } from "game/Game";
import { SkPickOne } from "client/utils/SkPickOne";

import { JsUtils, OmHooks, StorageHooks, SkScreen } from "../../SkScreen";
import style from "./style.m.css";

// TODO.impl enforce lang and coord-sys compatibility (num leaves)

/**
 * What coordinate systems are available will depend on what language
 * the user chooses.
 *
 * Implementation Note: subclasses must implement the `onClick`
 * behaviour of the `_nextBtn` and `_prevBtn` buttons.
 */
// TODO.learn how to use the IndexDB web API.
export abstract class _SetupScreen<SID extends SkScreen.Id.SETUP_OFFLINE | SkScreen.Id.SETUP_ONLINE> extends SkScreen<SID> {

	protected readonly langSel: _SetupScreen.LangPickOne;
	protected readonly langWeightExaggeration: HTMLInputElement;

	/**
	 * @override
	 */
	protected _lazyLoad(): void {
		this.baseElem.classList.add(style["this"]);
		this.baseElem.appendChild(this.nav.prev);

		// Language selection component:
		// @ts-expect-error : RO=
		this.langSel = new _SetupScreen.LangPickOne();
		this.baseElem.appendChild(this.langSel.baseElem);

		this._createLangWeightExaggerationInput();

		JsUtils.propNoWrite(this as _SetupScreen<SID>, "langSel", "langWeightExaggeration");

		this.baseElem.appendChild(this.nav.next);
		this._loadLastUsedPreset();
	}

	private _createLangWeightExaggerationInput(): void {
		const lwe
			// @ts-expect-error : RO=
			= this.langWeightExaggeration
			= JsUtils.mkEl("input", [style["lang-weight-exagg"]], {
				type: "range",
				min: "0",
				max: Lang.WeightExaggeration.MAX.toString(),
				step: "any",
				value: "1",
			});
		{
			const list = JsUtils.mkEl("datalist", []);
			list.id = OmHooks.Screen.Impl.Setup.Id.LANG_WEIGHT_EXAGGERATION_LIST;
			[{val:0,label:"0"}, {val:1,label:"1"}].forEach((tickDesc) => {
				list.appendChild(JsUtils.mkEl("option", [], {
					value: tickDesc.val.toString(),
					label: tickDesc.label,
				}));
			});
			this.baseElem.appendChild(list);
		}
		lwe.setAttribute("list", OmHooks.Screen.Impl.Setup.Id.LANG_WEIGHT_EXAGGERATION_LIST);
		this.baseElem.appendChild(lwe);
	}

	/**
	 * @override
	 */
	public getRecommendedFocusElem(): HTMLElement {
		return this.nav.next;
	}

	/**
	 * Load the user's last used preset to the gui controls.
	 */
	private _loadLastUsedPreset(): void {
		// TODO.impl
		const lastUsedPresetId = this.top.storage.Local.gamePresetId;
	}

	/**
	 * A helper for going to the next screen.
	 *
	 * Must return a completely new object each time.
	 * (think deep copy. no shared references.)
	 */
	protected parseArgsFromGui(): Game.CtorArgs<Game.Type.OFFLINE,Coord.System> {
		// TODO.impl
		const args: TU.NoRo<Game.CtorArgs<Game.Type.OFFLINE,Coord.System>>
			= Object.assign({}, _SetupScreen.DEFAULT_PRESET());
			// ^temporary default until _loadLastUsedPreset is implemented.
		args.langId = this.langSel.confirmedOpt.desc.id;
		args.langWeightExaggeration = parseFloat(this.langWeightExaggeration.value);
		return args;
	}
}
export namespace _SetupScreen {

	export const DEFAULT_PRESET = (): Game.CtorArgs<Game.Type.OFFLINE,Coord.System> => { return {
		coordSys: "W_EUCLID2" as Coord.System.W_EUCLID2,
		gridDimensions: {
			height: 10,
			width:  10,
		},
		averageFreeHealthPerTile: 1.0 / 45.0,
		langWeightExaggeration: 1.0,
		langId: "engl-low",
		playerDescs: ((): TU.RoArr<_Player.CtorArgs.PreIdAssignment> => [{
			isALocalOperator: false,
			familyId:   "CHASER",
			teamId:     1,
			clientId:   undefined,
			username:   "chaser1",
			avatar:     undefined,
			familyArgs: {/* Uses all defaults. */},
		}, {
			isALocalOperator: false,
			familyId:   "CHASER",
			teamId:     1,
			clientId:   undefined,
			username:   "chaser2",
			avatar:     undefined,
			familyArgs: {
				fearDistance: 6,
				bloodThirstDistance: 5,
				healthReserve: 5.0,
				keyPressesPerSecond: 1.8,
			},
		}])(), // <- Wrap in a function for better type checking.
	}; };
	/**
	 */
	export class LangPickOne extends SkPickOne<LangPickOne.Option> {
		public constructor() {
			super();
			this.baseElem.classList.add(style["lang-sel"]);
			Object.values(Lang.FrontendDescs).forEach((desc) => {
				this.addOption(new LangPickOne.Option(desc));
			});
			this.selectOpt(this.options[0]!);
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