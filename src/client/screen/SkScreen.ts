import { OmHooks } from "defs/OmHooks";
import type { AllSkScreens } from "./AllSkScreens";

import type {        HomeScreen } from "./impl/Home";
import type {   HowToPlayScreen } from "./impl/HowToPlay";
import type {   HowToHostScreen } from "./impl/HowToHost";
import type {  ColourCtrlScreen } from "./impl/ColourCtrl";
import type {   GameSetupScreen } from "./impl/GameSetup";
import type {  SeshJoinerScreen } from "./impl/SeshJoiner";
import type { PlayOfflineScreen } from "./impl/PlayOffline";
import type {  PlayOnlineScreen } from "./impl/PlayOnline";


/**
 *
 *
 * NOTE: Design decision: Isolate from the rest of the architecture.
 * Ie. Do not give it circular / upward references to anything that
 * references it.
 */
export abstract class SkScreen<SID extends SkScreen.Id> {

    readonly #parentElem: HTMLElement;

    protected readonly baseElem: HTMLElement;

    #hasLazyLoaded: boolean;

    /**
     * Implementations can use this as part of navigation button
     * handlers.
     */
    protected readonly requestGoToScreen: AllSkScreens["goToScreen"];

    /**
     *
     * @param parentElem -
     * @param requestGoToDisplay -
     */
    public constructor(
        parentElem: HTMLElement,
        requestGoToDisplay: AllSkScreens["goToScreen"],
    ) {
        this.#hasLazyLoaded = false;
        this.requestGoToScreen = requestGoToDisplay;
        this.#parentElem = parentElem;
    }

    /**
     * **Do not override.**
     */
    public async enter(ctorArgs: SkScreen.CtorArgs<SID>): Promise<void> {
        if (!this.#hasLazyLoaded) {
            const baseElem
                = (this.baseElem as HTMLElement)
                = document.createElement("div");
            baseElem.classList.add(OmHooks.Screen.Class.BASE);
            this.__lazyLoad();
            this.#parentElem.appendChild(baseElem);
        this.#hasLazyLoaded = true;
        }
        await this.__abstractOnBeforeEnter(ctorArgs);
        // ^Wait until the screen has finished setting itself up
        // before entering it.
        window.requestAnimationFrame((time) => {
            this.baseElem.dataset[OmHooks.Screen.Dataset.CURRENT] = ""; // exists.
            this.baseElem.setAttribute("aria-hidden", "false");
        });
    }

    /**
     * **Do not override.**
     */
    public leave(): boolean {
        if (this.__abstractOnBeforeLeave()) {
            delete this.baseElem.dataset[OmHooks.Screen.Dataset.CURRENT]; // non-existant.
            this.baseElem.setAttribute("aria-hidden", "true");
            return true;
        }
        return false;
    }

    /**
     * Implementations should set the CSS class for the base element,
     * and also set its aria label to an appropriate string.
     */
    protected abstract __lazyLoad(): void;

    /**
     * This is a good place to start any `setInterval` schedules, and
     * to bring focus to a starting HTML element if appropriate.
     *
     * The default implementation does nothing. Overriding implementations
     * from direct subclasses can safely skip making a supercall.
     */
    protected async __abstractOnBeforeEnter(ctorArgs: SkScreen.CtorArgs<SID>): Promise<void> { }

    /**
     * Return false if the leave should be cancelled. This functionality
     * allows an implementation to provide a prompt to the user such as
     * a confirmation modal warning that unsaved changes would be lost.
     *
     * This is a good place, for example, to stop any non-essential
     * `setInterval` schedules.
     */
    protected __abstractOnBeforeLeave(): boolean {
        return true;
    }

}
export namespace SkScreen {

    export const enum Id {
        HOME            = "home",
        HOW_TO_PLAY     = "howToPlay",
        HOW_TO_HOST     = "howToHost",
        COLOUR_CTRL     = "colourControl",
        GAME_SETUP      = "gameSetup",
        PLAY_OFFLINE    = "playOffline",
        PLAY_ONLINE     = "playOnline",
        SESH_JOINER     = "sessionJoiner",
    }

    export type CtorArgs<SID_group extends SkScreen.Id> = any extends SID_group ? never
    : { [SID in SID_group]:
        SID extends SkScreen.Id.PLAY_ONLINE ? PlayOnlineScreen.CtorArgs
        : SID extends SkScreen.Id ? {} // Placeholder for screens that haven't defined their ctor arg types yet.
        : never
    }[SID_group];
}
Object.freeze(SkScreen);
Object.freeze(SkScreen.prototype);
