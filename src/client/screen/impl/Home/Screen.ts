import { JsUtils, OmHooks, BaseScreen } from "../../BaseScreen";
import style from "./style.m.css";

/** */
export class HomeScreen extends BaseScreen<BaseScreen.Id.HOME> {

	/** @override */
	protected _abstractLazyLoad(): void {
		Object.freeze(this); //🧊
		this.baseElem.classList.add(
			OmHooks.General.Class.CENTER_CONTENTS,
			style["this"],
		);

		const nav = JsUtils.html("div", [
			OmHooks.General.Class.INPUT_GROUP,
			style["nav"],
		]);
		nav.setAttribute("role", "navigation");
		nav.addEventListener("pointerleave", () => {
			if (document.activeElement?.parentElement === nav) {
				(document.activeElement as HTMLElement).blur();
			}
		});
		const addToNav = (elem: HTMLElement, desc: { text: string, cssClass: string; }): void => {
			elem.classList.add(
				OmHooks.General.Class.CENTER_CONTENTS,
				OmHooks.General.Class.INPUT_GROUP_ITEM,
				desc.cssClass,
			);
			elem.textContent = desc.text;
			elem.addEventListener("pointerenter", () => {
				window.requestAnimationFrame((time) => {
					elem.focus();
				});
				// TODO.impl play a keyboard click sound.
				// this.top.sfx;
			});
			nav.appendChild(elem);
		};

		// NOTE: Define array entries in order that their
		// buttons should be tabbed through via keyboard.
		(<const>[{
			text:    "Offline\nSingle-player",
			cssClass: style["nav--play-offline"],
			screenId: BaseScreen.Id.SETUP_OFFLINE,
		},{
			text:    "Online\nMulti-player",
			cssClass: style["nav--play-online"],
			screenId: BaseScreen.Id.GROUP_JOINER,
		},{
			text:    "Learning Resources",
			cssClass: style["nav--learning"],
			screenId: BaseScreen.Id.LEARNING,
		},{
			text:    "How To Host",
			cssClass: style["nav--how-to-host"],
			screenId: BaseScreen.Id.HOW_TO_HOST,
		},{
			text:    "Settings",
			cssClass: style["nav--settings"],
			screenId: BaseScreen.Id.SETTINGS,
		}])
		.map<Readonly<{
			text: string;
			cssClass: typeof style[keyof typeof style];
			screenId: BaseScreen.Id;
		}>>((desc) => Object.freeze(desc))
		.forEach((desc) => {
			const button = JsUtils.html("button");
			button.addEventListener("click", (ev) => {
				// TODO.impl play a health-up sound.
				// this.top.sfx.;
				this.requestGoToScreen(desc.screenId as BaseScreen.Id, void 0);
			});
			addToNav(button, desc);
		});

		(<const>[{
			text:    "Source\nCode",
			cssClass: style["nav--goto-repo"],
			href:     new window.URL("https://github.com/david-fong/capswalk"),
		},{
			text:    "Report\na Bug",
			cssClass: style["nav--report-issue"],
			href:     new window.URL("https://github.com/david-fong/capswalk/issues"),
		}])
		.map<Readonly<{
			text: string;
			cssClass: typeof style[keyof typeof style];
			href: URL;
		}>>((desc) => Object.freeze(desc))
		.forEach((desc) => {
			const a = JsUtils.html("a", [], {
				href: (desc.href).toString(),
				//referrerPolicy: "strict-origin-when-cross-origin",
				target: "_blank",
			});
			addToNav(a, desc);
		});

		this.baseElem.appendChild(nav);
	}
}
Object.freeze(HomeScreen);
Object.freeze(HomeScreen.prototype);