import { OmHooks } from "defs/OmHooks";
import type { AllSkScreens } from "./AllSkScreens";

/**
 *
 *
 * NOTE: Design decision: Isolate from the rest of the architecture.
 * Ie. Do not give it circular / upward references to anything that
 * references it.
 */
export abstract class SkScreen {

    private parentElem: HTMLElement;

    protected readonly baseElem: HTMLElement;

    #hasLazyLoaded: boolean;

    /**
     * Implementations can use this as part of navigation button
     * handlers.
     */
    protected readonly requestGoToScreen: AllSkScreens["goToScreen"];

    public constructor(parentElem: HTMLElement, requestGoToDisplay: SkScreen["requestGoToScreen"]) {
        this.#hasLazyLoaded = false;
        this.requestGoToScreen = requestGoToDisplay;
        this.parentElem = parentElem;
    }

    /**
     * Do not override.
     */
    public enter(): void {
        if (!this.#hasLazyLoaded) {
            const baseElem = document.createElement("div");
            baseElem.classList.add(OmHooks.Screen.Class.BASE);
            (this.baseElem as HTMLElement) = baseElem;
            this.__lazyLoad();
            this.parentElem.appendChild(this.baseElem);
        this.#hasLazyLoaded = true;
        }
        this.__abstractOnBeforeEnter();
        this.baseElem.dataset[OmHooks.Screen.Dataset.CURRENT] = "";
    }

    /**
     * Do not override.
     */
    public leave(): boolean {
        if (this.__abstractOnBeforeLeave()) {
            delete this.baseElem.dataset[OmHooks.Screen.Dataset.CURRENT];
            return true;
        }
        return false;
    }

    protected abstract __lazyLoad(): void;

    /**
     * This is a good place to start any `setInterval` schedules, and
     * to bring focus to a starting HTML element if appropriate.
     */
    protected __abstractOnBeforeEnter(): void { }

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
}
Object.freeze(SkScreen);
Object.freeze(SkScreen.prototype);
