// Tell WebPack about the css we want:
import "./schemes/_barrel.css";
import style from "./style.m.css";

import { SkPickOne } from "client/utils/SkPickOne";
import { JsUtils, OmHooks, SkScreen } from "../../SkScreen";

/**
 */
export class ColourCtrlScreen extends SkScreen<SkScreen.Id.COLOUR_CTRL> {

	public readonly sel: ColourCtrlScreen.PickOne;

	/**
	 * @override
	 */
	protected _lazyLoad(): void {
		this.baseElem.classList.add(style["this"]);
		this.baseElem.appendChild(this.nav.prev);

		const sel
			// @ts-expect-error : RO=
			= this.sel
			= new ColourCtrlScreen.PickOne(
				this.top.storage.Local,
				this.top.transition,
			);
		JsUtils.propNoWrite(this as ColourCtrlScreen, "sel");
		this.baseElem.appendChild(sel.baseElem);

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
	/**
	 */
	export class PickOne extends SkPickOne<O> {

		#firstTime: boolean;
		readonly #storage: SkScreen<any>["top"]["storage"]["Local"];
		readonly #transition: SkScreen<any>["top"]["transition"];

		public constructor(
			storage: SkScreen<any>["top"]["storage"]["Local"],
			transition: SkScreen<any>["top"]["transition"],
		) {
			super();
			this.#firstTime = true;
			this.#storage = storage;
			this.#transition = transition;

			Colour.Schemes.forEach((schemeDesc) => {
				this.addOption(new PickOne.Option(schemeDesc));
			});
			this.selectOpt(this.getOptById(
				this.#storage.colourSchemeId ?? "snakey",
			)!, false);
		}

		public _onHoverOpt(opt: O): void {
			;
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
		/**
		 */
		export class Option extends SkPickOne._Option {

			public readonly desc: Colour.Scheme;

			public readonly cssLiteral: string;

			public constructor(desc: Colour.Scheme) {
				super();
				this.desc = desc;
				const base = this.baseElem;
				base.classList.add(style["opt"]);
				base.dataset[OmHooks.General.Dataset.COLOUR_SCHEME] = desc.id;

				const label = JsUtils.mkEl("span", [style["opt-label"]]); {
					label.appendChild(JsUtils.mkEl("div", [style["opt-label--title"]], {
						textContent: desc.displayName,
					}));
				}
				label.appendChild(JsUtils.mkEl("div", [style["opt-label--author"]], {
					textContent: "by " + desc.author,
				}));
				base.appendChild(label);

				for (let i = 0; i < Option.NUM_PREVIEW_SLOTS - 1; i++) {
					base.appendChild(JsUtils.mkEl("span", []));
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
			/**
			 * This must match the number slots used in the CSS.
			 */
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


/**
 *
 */
export namespace Colour {
	export const Swatch = Object.freeze(<const>[
		"mainFg", "mainBg",
		"tileFg", "tileBg", "tileBd",
		"healthFg", "healthBg",
		"pFaceMe", "pFaceMeOppo",
		"pFaceTeammate", "pFaceImtlTeammate",
		"pFaceOpponent", "pFaceImtlOpponent",
	]);
	export const Schemes = Object.freeze<Array<Scheme>>(([{
		id: "snakey",
		displayName: "Snakey",
		author: "N.W.",
	}, {
		id: "smooth-stone",
		displayName: "Smooth Stone",
		author: "Dav",
	}, {
		id: "murky-dive",
		displayName: "Murky Dive",
		author: "Stressed Dav", // I Was just working on game-grid scroll-wrap padding :')
	},
	]).map((scheme) => Object.freeze(scheme)));
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