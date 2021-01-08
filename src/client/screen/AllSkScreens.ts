import { JsUtils } from "defs/JsUtils";
import { SkScreen } from "./SkScreen";
import type { TopLevel } from "../TopLevel";

import {         HomeScreen } from "./impl/Home/Screen";
import {    HowToPlayScreen } from "./impl/HowToPlay";
import {    HowToHostScreen } from "./impl/HowToHost";
import {   ColourCtrlScreen } from "./impl/ColourCtrl/Screen";
// ====:   ~~~ OFFLINE ~~~  :============================
import { SetupOfflineScreen } from "./impl/Setup/Offline";
import {  PlayOfflineScreen } from "./impl/Play/Offline";
// ====:   ~~~ ONLINE ~~~~  :============================
import {  GroupJoinerScreen } from "./impl/GroupJoiner/Screen";
import {  SetupOnlineScreen } from "./impl/Setup/Online";
import {   GroupLobbyScreen } from "./impl/GroupLobby/Screen";
import {   PlayOnlineScreen } from "./impl/Play/Online";


/**
 * @final
 */
export class AllSkScreens {

	public readonly dict: SkScreen.AllSkScreensDict;

	#currentScreen: SkScreen<SkScreen.Id>;

	readonly #screenTransition: TopLevel["transition"];

	public constructor(top: TopLevel, baseElem: HTMLElement) {
		this.#screenTransition = top.transition;
		baseElem.setAttribute("role", "presentation");
		// Setting role="presentation" is similar to setting "display: content"
		// Setting aria-hidden="true" is similar to setting "visibility: hidden"

		const Id = SkScreen.Id;
		const t = top;
		const p = baseElem;
		const g = Object.freeze(this.goToScreen.bind(this));
		this.dict = Object.freeze({
			// TODO.impl turn this into a class that dynamically imports js and css
			// for all online-play-related modules together only once needed.
			[ Id.HOME          ]: new         HomeScreen(Id.HOME         ,t,p,g),
			[ Id.HOW_TO_PLAY   ]: new    HowToPlayScreen(Id.HOW_TO_PLAY  ,t,p,g),
			[ Id.HOW_TO_HOST   ]: new    HowToHostScreen(Id.HOW_TO_HOST  ,t,p,g),
			[ Id.COLOUR_CTRL   ]: new   ColourCtrlScreen(Id.COLOUR_CTRL  ,t,p,g),
			[ Id.SETUP_OFFLINE ]: new SetupOfflineScreen(Id.SETUP_OFFLINE,t,p,g),
			[ Id.PLAY_OFFLINE  ]: new  PlayOfflineScreen(Id.PLAY_OFFLINE ,t,p,g),
			[ Id.GROUP_JOINER  ]: new  GroupJoinerScreen(Id.GROUP_JOINER ,t,p,g),
			[ Id.SETUP_ONLINE  ]: new  SetupOnlineScreen(Id.SETUP_ONLINE ,t,p,g),
			[ Id.GROUP_LOBBY   ]: new   GroupLobbyScreen(Id.GROUP_LOBBY  ,t,p,g),
			[ Id.PLAY_ONLINE   ]: new   PlayOnlineScreen(Id.PLAY_ONLINE  ,t,p,g),
		});
		JsUtils.propNoWrite(this as AllSkScreens, "dict");
		Object.seal(this); //🧊

		// note: "isr" as in "Initial Screen Request".
		const isr = SkScreen.NavTree[window.location.hash.slice(1) as SkScreen.Id];
		window.setTimeout(() => {
			this.goToScreen(isr?.href ?? SkScreen.Id.HOME, {});
		}, 75);
		// TODO.learn For some reason, a small delay is required here to prevent
		// a bug which happens 70% of the time when starting up with files served
		// through the file:// protocol: The unblur part of ScreenTransition will
		// not happen. Even now, there is still an unexpected event handler that
		// gets left on the tint screen... spooky.

		window.addEventListener("popstate", (ev: PopStateEvent) => {
			// For corresponding calls to pushState and replaceState,
			// see SkScreen.enter.
			this.goToScreen(window.history.state.screenId, {});
		});
	}

	/**
	 * @returns `false` if cancelled.
	 * @param destId -
	 * @param ctorArgs -
	 */
	public async goToScreen<SID extends SkScreen.Id>(
		// NOTE: using a tuple wrapper to expand bundled type.
		destId: SID,
		ctorArgs: SkScreen.EntranceArgs[SID],
	): Promise<boolean> {
		const currScreen = this.currentScreen;
		const destScreen = this.dict[destId];
		// if (currScreen === destScreen) {
		//     throw new Error("never");
		// }
		this.#currentScreen = destScreen;

		const navDir = SkScreen.GET_NAV_DIR({
			curr: currScreen?.screenId,
			dest: destId,
		});
		if ((currScreen === undefined) || currScreen._leave(navDir)) {
			// Note on above "nullish coalesce": Special case entered
			// during construction when there is no currentScreen yet.
			// Any confirm-leave prompts made to the user were OK-ed.
			type EnterFunc = (navDir: SkScreen.NavDir, args: typeof ctorArgs) => Promise<void>;
			await this.#screenTransition.do({
				beforeUnblurAwait: (destScreen._enter as EnterFunc)(navDir, ctorArgs),
				beforeUnblur: () => {
					currScreen?._onAfterLeave();
					destScreen._onAfterEnter();
					destScreen.getRecommendedFocusElem()?.focus();
				},
			});
			return true;
		}
		return false;
	}

	public get currentScreen(): SkScreen<SkScreen.Id> {
		return this.#currentScreen;
	}
}
Object.freeze(AllSkScreens);
Object.freeze(AllSkScreens.prototype);