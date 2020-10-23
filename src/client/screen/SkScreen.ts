import { JsUtils } from "defs/JsUtils";
import { OmHooks } from "defs/OmHooks";
import { StorageHooks } from "defs/StorageHooks";
import type { Coord } from "floor/Tile";
import type { Game } from "game/Game";
import type { AllSkScreens } from "./AllSkScreens";
import type { TopLevel } from "../TopLevel";

import type {         HomeScreen } from "./impl/Home";
import type {    HowToPlayScreen } from "./impl/HowToPlay";
import type {    HowToHostScreen } from "./impl/HowToHost";
import type {   ColourCtrlScreen } from "./impl/ColourCtrl";
// ======== :   ~~~ OFFLINE ~~~  :============================
import type { SetupOfflineScreen } from "./impl/SetupOffline";
import type {  PlayOfflineScreen } from "./impl/PlayOffline";
// ======== :   ~~~ ONLINE ~~~~  :============================
import type {  GroupJoinerScreen } from "./impl/GroupJoiner";
import type {  SetupOnlineScreen } from "./impl/SetupOnline";
import type {   GroupLobbyScreen } from "./impl/GroupLobby";
import type {   PlayOnlineScreen } from "./impl/PlayOnline";

export { JsUtils, OmHooks, Coord, StorageHooks };

const OMHC = OmHooks.Screen.Class;


/**
 *
 *
 * NOTE: Design decision: Isolate from the rest of the architecture.
 * Ie. Do not give it circular / upward references to anything that
 * references it.
 */
export abstract class SkScreen<SID extends SkScreen.Id> {

    public readonly screenId: SID;
    public readonly screenNames: JsUtils.CamelCaseNameTransforms;

    protected readonly top: TopLevel;

    readonly #parentElem: HTMLElement;

    protected readonly baseElem: HTMLElement;

    #hasLazyLoaded: boolean;

    protected readonly nav: Readonly<{
        /**
         * `onclick` callback is registered automatically. Do not overwrite it.
         */
        prev: TU.Omit<HTMLButtonElement, "onclick">;
        next: HTMLButtonElement;
    }>;

    /**
     * Used as the initial screen when arriving at this website via url.
     * Returns this screen's own id by default.
     *
     * **IMPORTANT**: Must identify a screen whose `EntranceArgs` is
     * of type `{}`. Therefore, screens who don't take `{}` as entry
     * arguments must override this method.
     */
    public get initialScreen(): SkScreen.Id {
        return this.screenId;
    }
    /**
     * Used to define the behaviour of the navigation buttons.
     *
     * This should be a pure producer function. Any state modifications
     * or event emissions should be done in `abstractOnBeforeLeave`.
     *
     * **IMPORTANT**: Must pass SkScreen.NavDir.BACKWARD as the `historyDirection` argument.
     */
    public getNavPrevArgs(): Parameters<AllSkScreens["goToScreen"]> {
        const defaultDest = SkScreen.NavPrevDest[this.screenId] as SkScreen.Id | undefined;
        if (defaultDest) {
            return [defaultDest, {}, SkScreen.NavDir.BACKWARD];
        } else {
            throw new Error("never");
        }
    }

    /**
     * Implementations can use this as part of navigation button
     * handlers. Refers directly to AllSkScreens.goToScreen.
     */
    protected readonly requestGoToScreen: AllSkScreens["goToScreen"];


    /**
     *
     * @param parentElem -
     * @param requestGoToDisplay -
     */
    public constructor(
        screenId: SID,
        toplevel: TopLevel,
        parentElem: HTMLElement,
        requestGoToDisplay: AllSkScreens["goToScreen"],
    ) {
        this.screenId           = screenId;
        this.screenNames               = JsUtils.camelCaseTransforms(screenId);
        this.top                = toplevel;
        this.#parentElem        = parentElem;
        this.requestGoToScreen  = requestGoToDisplay;
        this.baseElem           = JsUtils.mkEl("div", []);
        this.#hasLazyLoaded     = false;
        this.nav = Object.freeze({
            prev: JsUtils.mkEl("button", []),
            next: JsUtils.mkEl("button", []),
        });
        JsUtils.propNoWrite<SkScreen<SID>>(this, [
            "screenId", "top", "baseElem", "nav", "requestGoToScreen",
        ]);
        this.nav.prev.classList.add(OMHC.NAV_PREV);
        this.nav.next.classList.add(OMHC.NAV_NEXT);
        this.nav.prev.textContent = "Back";
        this.nav.next.textContent = "Next";
        // @ts-expect-error : RO=
        this.nav.prev.onclick = (ev) => {
            this.requestGoToScreen(...this.getNavPrevArgs());
        };
    }

    /**
     * **Do not override.**
     */
    public async _enter(
        navDir: SkScreen.NavDir,
        args: SkScreen.EntranceArgs[SID],
    ): Promise<void> {
        if (!this.#hasLazyLoaded) {
            this.baseElem.classList.add(OmHooks.Screen.Class.BASE);
            this._lazyLoad();
            this.#parentElem.appendChild(this.baseElem);
            JsUtils.prependComment(this.baseElem, `${this.screenNames.spaceyUppercase} SCREEN`);
            this.baseElem.setAttribute("aria-label", this.screenNames.spaceyCapitalized + " Screen");
            this.#hasLazyLoaded = true;
        }
        {
            const location = new window.URL(window.location.href);
            location.hash = this.screenId;
            const args = <const>[{ screenId: this.screenId, }, "", location.href];
            switch (navDir) {
                case SkScreen.NavDir.BACKWARD: history.replaceState(...args); break;
                case SkScreen.NavDir.FORWARD:  history.pushState(   ...args); break;
                default: throw new Error("never");
            }
        }

        await this._abstractOnBeforeEnter(navDir, args);
        // ^Wait until the screen has finished setting itself up
        // before entering it.
        document.title = `${this.screenNames.spaceyCapitalized} | ${this.top.defaultDocTitle}`;
        window.requestAnimationFrame((time) => {
            this.baseElem.dataset[OmHooks.Screen.Dataset.CURRENT] = ""; // exists.
            this.baseElem.setAttribute("aria-hidden", "false");
        });
    }

    /**
     * **Do not override.**
     *
     * @returns false if the leave was cancelled.
     */
    public _leave(navDir: SkScreen.NavDir): boolean {
        if (this._abstractOnBeforeLeave(navDir)) {
            delete this.baseElem.dataset[OmHooks.Screen.Dataset.CURRENT]; // non-existant.
            this.baseElem.setAttribute("aria-hidden", "true");
            return true;
        }
        return false;
    }

    /**
     * Implementations should set the CSS class for the base element.
     */
    protected abstract _lazyLoad(): void;

    /**
     * This is a good place to start any `setInterval` schedules, and
     * to bring focus to a starting HTML element if appropriate.
     *
     * The default implementation does nothing. Overriding implementations
     * from direct subclasses can safely skip making a supercall.
     *
     * Important: Calls to `HTMLElement.focus` may require a small delay
     * via setTimeout. The reason for this is currently unknown.
     */
    protected async _abstractOnBeforeEnter(navDir: SkScreen.NavDir, args: SkScreen.EntranceArgs[SID]): Promise<void> { }

    /**
     * Return false if the leave should be cancelled. This functionality
     * allows an implementation to provide a prompt to the user such as
     * a confirmation modal warning that unsaved changes would be lost.
     *
     * This is a good place, for example, to stop any non-essential
     * `setInterval` schedules.
     *
     * This method will not be called upon navigating to a different
     * page, so actions such as writes to persisted storage should not
     * be placed here as an optimization.
     */
    protected _abstractOnBeforeLeave(navDir: SkScreen.NavDir): boolean {
        return true;
    }

}
export namespace SkScreen {

    export enum Id {
        // General:     ===================
        HOME            = "home",
        HOW_TO_PLAY     = "howToPlay",
        HOW_TO_HOST     = "howToHost",
        COLOUR_CTRL     = "colourControl",
        // Offline:     ===================
        SETUP_OFFLINE   = "setupOffline",
        PLAY_OFFLINE    = "playOffline",
        // Online:      ===================
        GROUP_JOINER    = "groupJoiner",
        SETUP_ONLINE    = "setupOnline",
        GROUP_LOBBY     = "groupLobby",
        PLAY_ONLINE     = "playOnline",
        // =======      ===================
    }
    export interface Dict {
        [ Id.HOME          ]: HomeScreen;
        [ Id.HOW_TO_PLAY   ]: HowToPlayScreen;
        [ Id.HOW_TO_HOST   ]: HowToHostScreen;
        [ Id.COLOUR_CTRL   ]: ColourCtrlScreen;
        //==================
        [ Id.SETUP_OFFLINE ]: SetupOfflineScreen;
        [ Id.PLAY_OFFLINE  ]: PlayOfflineScreen;
        //==================
        [ Id.GROUP_JOINER  ]: GroupJoinerScreen;
        [ Id.GROUP_LOBBY   ]: GroupLobbyScreen;
        [ Id.SETUP_ONLINE  ]: SetupOnlineScreen;
        [ Id.PLAY_ONLINE   ]: PlayOnlineScreen;
    }
    export interface EntranceArgs {
        [ Id.HOME          ]: {};
        [ Id.HOW_TO_PLAY   ]: {};
        [ Id.HOW_TO_HOST   ]: {};
        [ Id.COLOUR_CTRL   ]: {};
        //==================
        [ Id.SETUP_OFFLINE ]: {};
        [ Id.PLAY_OFFLINE  ]: Game.CtorArgs<Game.Type.OFFLINE,Coord.System>;
        //==================
        [ Id.GROUP_JOINER  ]: {};
        [ Id.GROUP_LOBBY   ]: Partial<{ groupName: string, groupPassphrase: string, }>;
        [ Id.SETUP_ONLINE  ]: {};
        [ Id.PLAY_ONLINE   ]: Game.CtorArgs<Game.Type.ONLINE,Coord.System>;
    }
    /**
     * Note: The fact that the lobby precedes the online setup screen
     * for the group host is important, since the socket listener for
     * UserInfoChange events is only registered in the lobby screen.
     */
    export const NavPrevDest = Object.freeze(<const>{
        [ Id.HOME          ]: Id.HOME,
        [ Id.HOW_TO_PLAY   ]: Id.HOME,
        [ Id.HOW_TO_HOST   ]: Id.HOME,
        [ Id.COLOUR_CTRL   ]: Id.HOME,
        //==================
        [ Id.SETUP_OFFLINE ]: Id.HOME,
        [ Id.PLAY_OFFLINE  ]: Id.SETUP_OFFLINE,
        //==================
        [ Id.GROUP_JOINER  ]: Id.HOME,
        [ Id.GROUP_LOBBY   ]: Id.GROUP_JOINER,
        [ Id.SETUP_ONLINE  ]: Id.GROUP_LOBBY,
        [ Id.PLAY_ONLINE   ]: Id.SETUP_ONLINE,
    });

    export const enum NavDir {
        FORWARD  = "forward",
        BACKWARD = "backward",
    };

    /**
     * Helper type for overriding SkScreen.getNavPrevArgs.
     */
    export type NavPrevRet<SID extends SkScreen.Id> = [SID, SkScreen.EntranceArgs[SID], NavDir.BACKWARD];
}
Object.freeze(SkScreen);
Object.freeze(SkScreen.prototype);