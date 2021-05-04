import { PickOne as _PickOne } from "::utils/PickOne";
import { ColourPickOne } from "./Colours";
import { JsUtils, StorageHooks, BaseScreen } from "../../BaseScreen";
import style from "./style.m.css";
import { EmojiSetPickOne } from "::screen/impl/Settings/Emojis";

/** */
export class SettingsScreen extends BaseScreen<BaseScreen.Id.SETTINGS> {

	/** @override */
	protected _abstractLazyLoad(): void {
		import(
			/* webpackChunkName: "colour-schemes" */
			/* webpackMode: "lazy-once" */
			`../../../colours/schemes/${void 0}.css`
		).catch((e) => {
			void e; // yeet!
		});
		this.baseElem.classList.add(style["this"]);
		this.baseElem.appendChild(this.nav.prev);
		{
			const colour = new ColourPickOne(this.top.transition);
			this.baseElem.appendChild(colour.baseElem);
		}{
			const emoji = new EmojiSetPickOne();
			this.baseElem.appendChild(emoji.baseElem);
		}
		this.baseElem.appendChild(SettingsScreen._mkMoreAnimationsCheckBox());
	}
}
export namespace SettingsScreen {
	/** */
	export function _mkMoreAnimationsCheckBox(): HTMLElement {
		const base = JsUtils.html("div");
		const htmlFor = Math.random().toString();
		const label = JsUtils.html("label", [], {
			textContent: "Enable more animations (consumes slightly more battery)",
			htmlFor,
		});
		const input = JsUtils.html("input", [], { type: "checkbox", id: htmlFor });
		input.checked = StorageHooks.Local.moreAnimations;
		input.addEventListener("change", () => {
			StorageHooks.Local.moreAnimations = input.checked;
		});
		base.appendChild(label);
		base.appendChild(input);
		return base;
	}
}
Object.freeze(SettingsScreen);
Object.freeze(SettingsScreen.prototype);