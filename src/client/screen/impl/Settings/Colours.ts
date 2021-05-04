import type { ScreenTransition } from "::screen/ScreenTransition";
import SchemesJsonImport from "::colours/schemes.json";
import { JsUtils, OmHooks, StorageHooks } from "../../BaseScreen";
import { PickOne as _PickOne } from "::utils/PickOne";
import style from "./Colours.m.css";


type O = ColourPickOne.Option;
/** */
export class ColourPickOne extends _PickOne<O> {

	#firstTime: boolean;
	readonly #transition: ScreenTransition;

	public constructor(transition: ScreenTransition) {
		super();
		this.#firstTime = true;
		this.#transition = transition;

		Colour.Schemes.forEach((schemeDesc) => {
			this.addOption(new ColourPickOne.Option(schemeDesc));
		});
		this.selectOpt(this.getOptById(
			StorageHooks.Local.colourSchemeId,
		)!, false);
	}

	public _onHoverOpt(opt: O): void {

	}

	public _onSelectOpt(opt: O): void {
		StorageHooks.Local.colourSchemeId = opt.desc.id;
		StorageHooks.Local.colourSchemeStyleLiteral = opt.cssLiteral;
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
export namespace ColourPickOne {
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
Object.freeze(ColourPickOne);
Object.freeze(ColourPickOne.prototype);


/** */
export namespace Colour {
	export const Swatch = Object.freeze(<const>[
		"mainFg", "mainBg",
		"tileFg", "tileBg", "tileBd",
		"healthFg", "healthBg",
		"pFaceMe", "pFaceMeOppo",
		"pFaceTeammate",
		"pFaceOpponent",
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