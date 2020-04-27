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

    protected readonly baseElem: HTMLElement;

    #hasLazyLoaded: boolean;

    /**
     * Implementations can use this as part of navigation button
     * handlers.
     */
    protected readonly requestGoToScreen: AllSkScreens["goToScreen"];

    public constructor(parentElem: HTMLElement, requestGoToDisplay: SkScreen["requestGoToScreen"]) {
        const baseElem = document.createElement("div");
        baseElem.classList.add(OmHooks.Screen.Class.BASE);
        parentElem.appendChild(baseElem);
        this.#hasLazyLoaded = false;
        this.requestGoToScreen = requestGoToDisplay;
    }

    public enter(): void {
        if (!this.#hasLazyLoaded) {
            this.__lazyLoad();
            this.#hasLazyLoaded = true;
        }
        this.__abstractOnBeforeEnter();
    }

    public leave(): boolean {
        return this.__abstractOnBeforeLeave();
    }

    protected abstract __lazyLoad(): void;

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

    /**
     * This is a good place to start any `setInterval` schedules, and
     * to bring focus to a starting HTML element if appropriate.
     */
    protected __abstractOnBeforeEnter(): void { }

}
export namespace SkScreen {

    export const enum Id {
        HOME,
        GAME_SETUP,
        SESH_JOINER,
        HOW_TO_PLAY,
        HOW_TO_HOST,
        PLAY_GAME,
    }
}
Object.freeze(SkScreen);
Object.freeze(SkScreen.prototype);
