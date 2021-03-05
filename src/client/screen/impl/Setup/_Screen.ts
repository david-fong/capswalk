import { Lang, Player } from "defs/TypeDefs";
import type { Coord } from "floor/Coord";
import type { Player as _Player } from "game/player/Player";
import type { Game } from "game/Game";
import { PickOne } from "client/utils/PickOne";

import { JsUtils, OmHooks, StorageHooks, BaseScreen } from "../../BaseScreen";
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
export abstract class _SetupScreen<SID extends BaseScreen.Id.SETUP_OFFLINE | BaseScreen.Id.SETUP_ONLINE> extends BaseScreen<SID> {

	protected readonly langSel = new _SetupScreen.LangPickOne();
	protected readonly langWeightExaggeration: HTMLInputElement;

	/** @override */
	protected _lazyLoad(): void {
		this.baseElem.classList.add(style["this"]);
		this.baseElem.appendChild(this.nav.prev);

		// Language selection component:
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
			= JsUtils.html("input", [style["lang-weight-exagg"]], {
				type: "range",
				min: "0",
				max: Lang.WeightExaggeration.MAX.toString(),
				step: "any",
				value: "1",
			});
		{
			const list = JsUtils.html("datalist");
			list.id = OmHooks.Screen.Impl.Setup.Id.LANG_WEIGHT_EXAGGERATION_LIST;
			[{val:0,label:"0"}, {val:1,label:"1"}].forEach((tickDesc) => {
				list.appendChild(JsUtils.html("option", [], {
					value: tickDesc.val.toString(),
					label: tickDesc.label,
				}));
			});
			this.baseElem.appendChild(list);
		}
		lwe.setAttribute("list", OmHooks.Screen.Impl.Setup.Id.LANG_WEIGHT_EXAGGERATION_LIST);
		this.baseElem.appendChild(lwe);
	}

	/** @override */
	public getRecommendedFocusElem(): HTMLElement {
		return this.nav.next;
	}

	/**
	 * Load the user's last used preset to the gui controls.
	 */
	private _loadLastUsedPreset(): void {
		// TODO.impl
		const lastUsedPresetId = this.top.storage.Local.gamePresetId;
		const args = this.top.storage.IDB.UserGamePresetStore;
	}

	/**
	 * A helper for going to the next screen.
	 *
	 * Must return a completely new object each time.
	 * (think deep copy. no shared references.)
	 * @virtual
	 */
	protected parseArgsFromGui(): Game.CtorArgs.UnFin {
		// TODO.impl
		const args: TU.NoRo<Game.CtorArgs.UnFin>
			= Object.assign({}, _SetupScreen.DEFAULT_PRESET());
			// ^temporary default until _loadLastUsedPreset is implemented.
		args.langId = this.langSel.confirmedOpt.desc.id;
		args.langWeightExaggeration = parseFloat(this.langWeightExaggeration.value);
		return args;
	}
}
export namespace _SetupScreen {

	export const DEFAULT_PRESET = (): Game.CtorArgs.UnFin => { return {
		coordSys: "W_EUCLID2" as Coord.System.W_EUCLID2,
		gridDimensions: {
			height: 10,
			width:  10,
		},
		averageHealthPerTile: 1.0 / 45.0,
		langWeightExaggeration: 1.0,
		langId: "engl-low",
		players: ((): ReadonlyArray<_Player.CtorArgs.UnFin> => [{
			familyId:   "CHASER",
			teamId:     1,
			username:   "chaser1",
			avatar:     Player.Avatar.GET_RANDOM(),
			familyArgs: {/* Uses all defaults. */},
		}, {
			familyId:   "CHASER",
			teamId:     1,
			username:   "chaser2",
			avatar:     Player.Avatar.GET_RANDOM(),
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
	export class LangPickOne extends PickOne<LangPickOne.Option> {
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
		/** */
		export class Option extends PickOne._Option {

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
	Object.freeze(LangPickOne);
	Object.freeze(LangPickOne.prototype);
}
Object.freeze(_SetupScreen);
Object.freeze(_SetupScreen.prototype);