import { Lang, Player } from ":defs/TypeDefs";
import { LangDescs } from ":lang/LangDescs";
import type { Coord } from ":floor/Tile";
import type { Player as _Player } from ":game/player/Player";
import type { Game } from ":game/Game";
import { PickOne } from "::utils/PickOne";

import { JsUtils, OmHooks, StorageHooks, BaseScreen } from "../../BaseScreen";
import style from "./style.m.css";

// TODO.impl enforce lang and coord-sys compatibility (num leaves)
// TODO.impl enforce that the grid area is some ratio greater than the number of entities.

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

	protected override _abstractLazyLoad(): void {
		this.baseElem.classList.add(style["this"]);
		this.baseElem.appendChild(this.nav.prev);

		// Language selection component:
		this.baseElem.appendChild(this.langSel.baseElem);

		this.#createLangWeightExaggerationInput();

		JsUtils.propNoWrite(this as _SetupScreen<SID>, "langSel", "langWeightExaggeration");

		this.baseElem.appendChild(this.nav.next);
		this.#loadLastUsedPreset();
	}

	#createLangWeightExaggerationInput(): void {
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

	public override getRecommendedFocusElem(): HTMLElement {
		return this.nav.next;
	}

	/**
	 * Load the user's last used preset to the gui controls.
	 */
	#loadLastUsedPreset(): void {
		// TODO.impl
		const lastUsedPresetId = StorageHooks.Local.gamePresetId;
		const args = StorageHooks.IDB.UserGamePresetStore;
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
			= { ..._SetupScreen.DEFAULT_PRESET() };
			// ^temporary default until _loadLastUsedPreset is implemented.
		args.langId = this.langSel.confirmedOpt.desc.id;
		args.langWeightExaggeration = parseFloat(this.langWeightExaggeration.value);
		return args;
	}
}
export namespace _SetupScreen {

	export const DEFAULT_PRESET = (): Game.CtorArgs.UnFin => ({
		coordSys: "Euclid2" as Coord.System.W_EUCLID2,
		gridDimensions: {
			height: 10,
			width:  10,
			_render: { wrapX: 2, wrapY: 2 },
		},
		langWeightExaggeration: 1.0,
		langId: "engl-low",
		players: ((): readonly _Player.CtorArgs.UnFin[] => [{
			familyId:   "Chaser",
			teamId:     1,
			username:   "chaser1",
			avatar:     Player.Avatar.GET_RANDOM(),
			familyArgs: {/* Uses all defaults. */},
		}, {
			familyId:   "Chaser",
			teamId:     1,
			username:   "chaser2",
			avatar:     Player.Avatar.GET_RANDOM(),
			familyArgs: {
				fearDistance: 6,
				bloodThirstDistance: 5,
				healthReserve: 5.0,
				keyPressesPerSecond: 1.2,
			},
		}])(), // <- Wrap in a function for better type checking.
	});
	/**
	 */
	export class LangPickOne extends PickOne<LangPickOne.Option> {
		public constructor() {
			super();
			this.baseElem.classList.add(style["lang-sel"]);
			Object.values(LangDescs).freeze().forEach((desc) => {
				this.addOption(new LangPickOne.Option(desc));
			});
			this.selectOpt(this.options[0]!);
		}
		public override _onHoverOpt(opt: LangPickOne.Option): void {
		}
		public override _onSelectOpt(opt: LangPickOne.Option): void {
		}
	}
	export namespace LangPickOne {
		/** */
		export class Option extends PickOne._Option {

			public readonly desc: Lang.Desc;

			public constructor(desc: Lang.Desc) {
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