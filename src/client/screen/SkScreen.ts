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
     * Implementations can use this as part of navigation button
     * handlers. Refers directly to AllSkScreens.goToScreen.
     */
    protected readonly requestGoToScreen: AllSkScreens["goToScreen"];


    /**
     *
     * @param parentElem -
     * @param requestGoToScreen -
     */
    public constructor(
        screenId: SID,
        toplevel: TopLevel,
        parentElem: HTMLElement,
        requestGoToScreen: AllSkScreens["goToScreen"],
    ) {
        this.screenId           = screenId;
        this.screenNames        = JsUtils.camelCaseTransforms(screenId);
        this.top                = toplevel;
        this.#parentElem        = parentElem;
        this.requestGoToScreen  = requestGoToScreen;
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
            const tree = SkScreen.NavTree;
            if (tree[tree[this.screenId].prev].href === tree[this.screenId].href) {
                this.requestGoToScreen(SkScreen.NavTree[screenId].prev, {});
            } else {
                window.history.back();
            }
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

        document.title = `${this.screenNames.spaceyCapitalized} | ${this.top.defaultDocTitle}`;
        if (navDir === SkScreen.NavDir.FORWARD) {
            const location = new window.URL(window.location.href);
            const newHistoryRoot = location.hash = SkScreen.NavTree[this.screenId].href;
            const args: Parameters<typeof window.history.pushState> = [{ screenId: this.screenId, }, "", location.href];
            if (window.history.state?.screenId !== newHistoryRoot) {
                if (SkScreen.NavTree[this.screenId].prev === this.screenId) {
                    // If entering the root screen for the first time:
                    history.replaceState(...args);
                } else {
                    history.pushState(...args);
                }
            }
        }

        const entranceRetval = await this._abstractOnBeforeEnter(navDir, args);
        if (entranceRetval.elemToFocus !== undefined) {
            setTimeout(() => { entranceRetval.elemToFocus!.focus(); }, 100);
            // For some reason a small delay is needed.
        }
        // ^Wait until the screen has finished setting itself up
        // before entering it.
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
     * This is a good place to start any `setInterval` schedules.
     *
     * The default implementation does nothing. Overriding implementations
     * from direct subclasses can safely skip making a supercall.
     */
    protected async _abstractOnBeforeEnter(
        navDir: SkScreen.NavDir,
        args: SkScreen.EntranceArgs[SID],
    ): Promise<SkScreen.EntranceRetVal> {
        return {};
    };

    /**
     * Return false if the leave should be cancelled. This functionality
     * allows an implementation to provide a prompt to the user such as
     * a confirmation modal warning that unsaved changes would be lost.
     *
     * top any non-essential `setInterval` schedules that were set up
     * in `_abstractOnBeforeEnter`.
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
    Object.freeze(Id);

    export const enum HistoryEntryId {
    }
    export interface AllSkScreensDict {
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
    /**
     * If not a navigation leaf, must be `{}`. If history root is not
     * self, then can be a partial object for forward navigation.
     */
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
    export type EntranceRetVal = TU.NoRo<{
        elemToFocus?: HTMLElement;
    }>;
    /**
     * Note that forward navigation has no obligation to comply with
     * the navigation tree.
     *
     * Note: The fact that the lobby precedes the online setup screen
     * for the group host is important, since the socket listener for
     * UserInfoChange events is only registered in the lobby screen.
     */
    export const NavTree = Object.freeze(<const>{
        [ Id.HOME          ]: { prev: Id.HOME,          href: Id.HOME, },
        [ Id.HOW_TO_PLAY   ]: { prev: Id.HOME,          href: Id.HOW_TO_PLAY, },
        [ Id.HOW_TO_HOST   ]: { prev: Id.HOME,          href: Id.HOW_TO_HOST, },
        [ Id.COLOUR_CTRL   ]: { prev: Id.HOME,          href: Id.COLOUR_CTRL, },
        //==========================================================================
        [ Id.SETUP_OFFLINE ]: { prev: Id.HOME,          href: Id.SETUP_OFFLINE, },
        [ Id.PLAY_OFFLINE  ]: { prev: Id.SETUP_OFFLINE, href: Id.SETUP_OFFLINE, },
        //==========================================================================
        [ Id.GROUP_JOINER  ]: { prev: Id.HOME,          href: Id.GROUP_JOINER, },
        [ Id.GROUP_LOBBY   ]: { prev: Id.GROUP_JOINER,  href: Id.GROUP_JOINER, },
        [ Id.SETUP_ONLINE  ]: { prev: Id.GROUP_LOBBY,   href: Id.GROUP_JOINER, },
        [ Id.PLAY_ONLINE   ]: { prev: Id.GROUP_LOBBY,   href: Id.GROUP_JOINER, },
    });
    (function assertNavigationTreeIsValid(): void { Object.entries(NavTree).forEach(([id, desc]) => {
        let prev = id as Id;
        const visited = new Set<Id>();
        do {
            if (visited.has(prev)) {
                throw new Error("Navigation tree must not contain cycles.");
            }
            visited.add(prev);
            prev = NavTree[prev].prev;
            if (prev === id) {
                break;
            }
        } while (prev !== NavTree[prev].prev);
        if (prev !== Id.HOME) {
            throw new Error("The home screen must be the root of the screen-navigation tree.");
        }
    }); })();

    export const enum NavDir {
        FORWARD  = "forward",
        BACKWARD = "backward",
    };
    export function GET_NAV_DIR(_args: { curr: Id | undefined, dest: Id, }): NavDir {
        const { curr, dest } = _args;
        if (curr === undefined) return SkScreen.NavDir.FORWARD;
        let prev = curr;
        while (prev !== SkScreen.NavTree[prev].prev) {
            prev      = SkScreen.NavTree[prev].prev;
            if (prev === dest) return SkScreen.NavDir.BACKWARD;
        }

        // if (NavTree[dest].prev !== curr) {
        //     throw new Error(`${dest} is not reachable from ${curr}.`);
        // }
        // If do-while completes, then dest must be in the forward direction:
        return SkScreen.NavDir.FORWARD;
    }
}
Object.freeze(SkScreen);
Object.freeze(SkScreen.prototype);