import { JsUtils, OmHooks, SkScreen } from "../../SkScreen";
import CSS from "./style.m.css";


/**
 *
 */
export class HomeScreen extends SkScreen<SkScreen.Id.HOME> {

	private readonly navElem: HTMLElement;

	/**
	 * @override
	 */
	protected _lazyLoad(): void {
		this.baseElem.classList.add(
			OmHooks.General.Class.CENTER_CONTENTS,
			CSS["this"],
		);

		const nav
			// @ts-expect-error : RO=
			= this.navElem
			= JsUtils.mkEl("div", [
				OmHooks.General.Class.TEXT_SELECT_DISABLED,
				OmHooks.General.Class.INPUT_GROUP,
				CSS["nav"],
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
			text:    "Offline Single-player",
			cssClass: CSS["nav--play-offline"],
			screenId: SkScreen.Id.SETUP_OFFLINE,
		},{
			text:    "Online Multi-player",
			cssClass: CSS["nav--play-online"],
			screenId: SkScreen.Id.GROUP_JOINER,
		},{
			text:    "How To Play",
			cssClass: CSS["nav--how-to-play"],
			screenId: SkScreen.Id.HOW_TO_PLAY,
		},{
			text:    "How To Host",
			cssClass: CSS["nav--how-to-host"],
			screenId: SkScreen.Id.HOW_TO_HOST,
		},{
			text:    "Colour Schemes",
			cssClass: CSS["nav--colour-scheme"],
			screenId: SkScreen.Id.COLOUR_CTRL,
		}])
		.map<Readonly<{
			text: string;
			cssClass: typeof CSS[keyof typeof CSS];
			screenId: SkScreen.Id | ((ev: MouseEvent) => void);
		}>>((desc) => Object.freeze(desc))
		.forEach((desc) => {
			const button = JsUtils.mkEl("button", []);
			button.onclick = (desc.screenId instanceof Function) ? desc.screenId : () => {
				// TODO.impl play a health-up sound.
				// this.top.sfx.;
				this.requestGoToScreen(desc.screenId as SkScreen.Id, {});
			};
			addToNav(button, desc);
		});

		(<const>[{
			text:    "Visit\nRepo",
			cssClass: CSS["nav--goto-repo"],
			href:     new window.URL("https://github.com/david-fong/snakey3"),
		},{
			text:    "Report\nIssue",
			cssClass: CSS["nav--report-issue"],
			href:     new window.URL("https://github.com/david-fong/snakey3/issues"),
		}])
		.map<Readonly<{
			text: string;
			cssClass: typeof CSS[keyof typeof CSS];
			href: URL;
		}>>((desc) => Object.freeze(desc))
		.forEach((desc) => {
			const a = JsUtils.mkEl("a", [], {
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