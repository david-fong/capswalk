import { JsUtils } from "defs/JsUtils";
import { BaseScreen } from "./BaseScreen";
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

export interface AllSkScreensDict {
	[ BaseScreen.Id.HOME          ]: HomeScreen;
	[ BaseScreen.Id.HOW_TO_PLAY   ]: HowToPlayScreen;
	[ BaseScreen.Id.HOW_TO_HOST   ]: HowToHostScreen;
	[ BaseScreen.Id.COLOUR_CTRL   ]: ColourCtrlScreen;
	//=============================
	[ BaseScreen.Id.SETUP_OFFLINE ]: SetupOfflineScreen;
	[ BaseScreen.Id.PLAY_OFFLINE  ]: PlayOfflineScreen;
	//=============================
	[ BaseScreen.Id.GROUP_JOINER  ]: GroupJoinerScreen;
	[ BaseScreen.Id.GROUP_LOBBY   ]: GroupLobbyScreen;
	[ BaseScreen.Id.SETUP_ONLINE  ]: SetupOnlineScreen;
	[ BaseScreen.Id.PLAY_ONLINE   ]: PlayOnlineScreen;
}

/**
 * @final
 */
export class AllScreens {

	public readonly dict: AllSkScreensDict;

	#currentScreen: BaseScreen<BaseScreen.Id>;

	readonly #screenTransition: TopLevel["transition"];

	public constructor(top: TopLevel, baseElem: HTMLElement) {
		this.#screenTransition = top.transition;
		baseElem.setAttribute("role", "presentation");
		// Setting role="presentation" is similar to setting "display: content"
		// Setting aria-hidden="true" is similar to setting "visibility: hidden"

		const Id = BaseScreen.Id;
		const ctx = Object.freeze<BaseScreen.CtorArgs>({
			toplevel: top,
			parentElem: baseElem,
			goToScreen: Object.freeze(this.goToScreen.bind(this)),
		});
		this.dict = Object.freeze({
			// TODO.impl turn this into a class that dynamically imports js and css
			// for all online-play-related modules together only once needed.
			[ Id.HOME          ]: new         HomeScreen(ctx, Id.HOME),
			[ Id.HOW_TO_PLAY   ]: new    HowToPlayScreen(ctx, Id.HOW_TO_PLAY),
			[ Id.HOW_TO_HOST   ]: new    HowToHostScreen(ctx, Id.HOW_TO_HOST),
			[ Id.COLOUR_CTRL   ]: new   ColourCtrlScreen(ctx, Id.COLOUR_CTRL),
			[ Id.SETUP_OFFLINE ]: new SetupOfflineScreen(ctx, Id.SETUP_OFFLINE),
			[ Id.PLAY_OFFLINE  ]: new  PlayOfflineScreen(ctx, Id.PLAY_OFFLINE),
			[ Id.GROUP_JOINER  ]: new  GroupJoinerScreen(ctx, Id.GROUP_JOINER),
			[ Id.SETUP_ONLINE  ]: new  SetupOnlineScreen(ctx, Id.SETUP_ONLINE),
			[ Id.GROUP_LOBBY   ]: new   GroupLobbyScreen(ctx, Id.GROUP_LOBBY),
			[ Id.PLAY_ONLINE   ]: new   PlayOnlineScreen(ctx, Id.PLAY_ONLINE),
		});
		JsUtils.propNoWrite(this as AllScreens, "dict");
		Object.seal(this); //🧊

		// note: "isr" as in "Initial Screen Request".
		const isr = BaseScreen.NavTree[window.location.hash.slice(1) as BaseScreen.Id];
		window.setTimeout(() => {
			this.goToScreen(isr?.href ?? BaseScreen.Id.HOME, {});
		});

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
	public async goToScreen<SID extends BaseScreen.Id>(
		// NOTE: using a tuple wrapper to expand bundled type.
		destId: SID,
		ctorArgs: BaseScreen.EntranceArgs[SID],
	): Promise<boolean> {
		const currScreen = this.currentScreen;
		const destScreen = this.dict[destId];
		// if (currScreen === destScreen) {
		//     throw new Error("never");
		// }
		this.#currentScreen = destScreen;

		const navDir = BaseScreen.GET_NAV_DIR({
			curr: currScreen?.screenId,
			dest: destId,
		});
		if ((currScreen === undefined) || currScreen._leave(navDir)) {
			// Note on above "nullish coalesce": Special case entered
			// during construction when there is no currentScreen yet.
			// Any confirm-leave prompts made to the user were OK-ed.
			type EnterFunc = (navDir: BaseScreen.NavDir, args: typeof ctorArgs) => Promise<void>;
			await this.#screenTransition.do({
				whileBeforeUnblur: (destScreen._enter as EnterFunc)(navDir, ctorArgs),
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

	public get currentScreen(): BaseScreen<BaseScreen.Id> {
		return this.#currentScreen;
	}
}
Object.freeze(AllScreens);
Object.freeze(AllScreens.prototype);