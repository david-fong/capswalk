// Tell WebPack about the css we want:
import style from "./style.m.css";
import SchemesJsonImport from "client/colours/schemes.json";

import { PickOne as _PickOne } from "client/utils/PickOne";
import { JsUtils, OmHooks, BaseScreen } from "../../BaseScreen";

/** */
export class ColourCtrlScreen extends BaseScreen<BaseScreen.Id.COLOUR_CTRL> {

	public readonly sel: ColourCtrlScreen.PickOne;

	/** @override */
	protected _abstractLazyLoad(): void {
		import(
			/* webpackChunkName: "colour-schemes" */
			/* webpackMode: "lazy-once" */
			`client/colours/schemes/${void 0}.css`
		).catch((e) => {
			void 0; // yeet.
		});
		this.baseElem.classList.add(style["this"]);
		this.baseElem.appendChild(this.nav.prev);

		// @ts-expect-error : RO=
		this.sel = new ColourCtrlScreen.PickOne(
			this.top.storage.Local,
			this.top.transition,
		);
		JsUtils.propNoWrite(this as ColourCtrlScreen, "sel");
		this.baseElem.appendChild(this.sel.baseElem);

		// Highlight the user's last selected colour scheme (if it exists).
		// This will already have been loaded up during page load, hence
		// passing `false` to the `noCallback` argument
		const lastUsedSchemeId = this.top.storage.Local.colourSchemeId;
		if (lastUsedSchemeId) {
			this.sel.selectOpt(this.sel.getOptById(lastUsedSchemeId)!, false);
		}
	}
}
export namespace ColourCtrlScreen {
	type O = PickOne.Option;
	/** */
	export class PickOne extends _PickOne<O> {

		#firstTime: boolean;
		readonly #storage: BaseScreen<any>["top"]["storage"]["Local"];
		readonly #transition: BaseScreen<any>["top"]["transition"];

		public constructor(
			storage: BaseScreen<any>["top"]["storage"]["Local"],
			transition: BaseScreen<any>["top"]["transition"],
		) {
			super();
			this.#firstTime = true;
			this.#storage = storage;
			this.#transition = transition;

			Colour.Schemes.forEach((schemeDesc) => {
				this.addOption(new PickOne.Option(schemeDesc));
			});
			this.selectOpt(this.getOptById(
				this.#storage.colourSchemeId ?? "default",
			)!, false);
		}

		public _onHoverOpt(opt: O): void {

		}

		public _onSelectOpt(opt: O): void {
			this.#storage.colourSchemeId = opt.desc.id;
			this.#storage.colourSchemeStyleLiteral = opt.cssLiteral;
			const firstTime = this.#firstTime;
			this.#firstTime = false;

			this.#transition.do({
				intermediateTransitionTrigger: (): void => {
					document.documentElement.dataset[OmHooks.General.Dataset.COLOUR_SCHEME] = opt.desc.id;
					// Clear related style attribute variables set on page enter:
					const docStyle = document.documentElement.style;
					if (firstTime) {
						for (const swatchName of Colour.Swatch) {
							const varString = "--colour-" + swatchName;
							docStyle.setProperty(varString, "");
						}
					}
				},
			});
		}

		public getOptById(searchId: Colour.Scheme["id"]): O | undefined {
			return this.options.find((opt) => opt.desc.id === searchId);
		}
	}
	export namespace PickOne {
		/** */
		export class Option extends _PickOne._Option {

			public readonly desc: Colour.Scheme;

			public readonly cssLiteral: string;

			public constructor(desc: Colour.Scheme) {
				super();
				this.desc = desc;
				const base = this.baseElem;
				base.classList.add(style["opt"]);
				base.dataset[OmHooks.General.Dataset.COLOUR_SCHEME] = desc.id;

				const label = JsUtils.html("span", [style["opt-label"]]); {
					label.appendChild(JsUtils.html("div", [style["opt-label--title"]], {
						textContent: desc.displayName,
					}));
				}
				label.appendChild(JsUtils.html("div", [style["opt-label--author"]], {
					textContent: "by " + desc.author,
				}));
				base.appendChild(label);

				for (let i = 0; i < Option.NUM_PREVIEW_SLOTS - 1; i++) {
					base.appendChild(JsUtils.html("span"));
				}
				// At below: We need to append it to something to use getComputedStyle :/
				// We attach it in the proper place once we get that.
				document.body.appendChild(base);
				let cssLiteral = "";
				const computedStyle = window.getComputedStyle(base);
				for (const swatchName of Colour.Swatch) {
					const varString = "--colour-" + swatchName;
					cssLiteral += varString + ":" + computedStyle.getPropertyValue(varString) + ";";
				}
				this.cssLiteral = cssLiteral;
			}
		}
		export namespace Option {
			/** This must match the number slots used in the CSS. */
			export const NUM_PREVIEW_SLOTS = 8;
		}
		Object.freeze(Option);
		Object.freeze(Option.prototype);
	}
	Object.freeze(PickOne);
	Object.freeze(PickOne.prototype);
}
Object.freeze(ColourCtrlScreen);
Object.freeze(ColourCtrlScreen.prototype);


/** */
export namespace Colour {
	export const Swatch = Object.freeze(<const>[
		"mainFg", "mainBg",
		"tileFg", "tileBg", "tileBd",
		"healthFg", "healthBg",
		"pFaceMe", "pFaceMeOppo",
		"pFaceTeammate", "pFaceImtlTeammate",
		"pFaceOpponent", "pFaceImtlOpponent",
	]);
	export const Schemes = JsUtils.deepFreeze<Scheme[]>(Array.from(SchemesJsonImport));
	export type Scheme = Readonly<{
		/**
		 * Must be matched in the CSS as an attribute value.
		 * Must also equal the name of the original source file.
		 */
		id: string;
		displayName: string;
		author: string;
	}>;
}
Object.freeze(Colour);