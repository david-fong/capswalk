import { OmHooks } from "../OmHooks";

import {          HomeScreen } from "./impl/Home";
import {     GameSetupScreen } from "./impl/GameSetup";
import { SessionJoinerScreen } from "./impl/SessionJoiner";
import {     HowToPlayScreen } from "./impl/HowToPlay";
import {     HowToHostScreen } from "./impl/HowToHost";
import {      PlayGameScreen } from './impl/PlayGame';

/**
 *
 *
 * NOTE: Design decision: Isolate from the rest of the architecture.
 * Ie. Do not give it circular / upward references to anything that
 * references it.
 */
export abstract class SkScreen {

    protected readonly baseElem: HTMLElement;

    private hasLazyLoaded: boolean;

    /**
     * Implementations can use this as part of navigation button
     * handlers.
     */
    protected readonly requestGoToScreen: {(dest: SkScreen)}

    public constructor(parentElem: HTMLElement, requestGoToDisplay: SkScreen["requestGoToScreen"]) {
        const baseElem = document.createElement("div");
        baseElem.classList.add(OmHooks.Screen.Class.BASE);
        parentElem.appendChild(baseElem);
        this.hasLazyLoaded = false;
        this.requestGoToScreen = requestGoToDisplay;
    }

    public enter(): void {
        if (!this.hasLazyLoaded) {
            this.__lazyLoad();
            this.hasLazyLoaded = true;
        }
        this.__abstractOnBeforeEnter();
    }

    public leave(): void {
        this.__abstractOnBeforeLeave();
    }

    protected abstract __lazyLoad(): void;

    /**
     * This is a good place, for example, to stop any non-essential
     * `setInterval` schedules.
     */
    protected __abstractOnBeforeLeave(): void {}

    /**
     * This is a good place to start any `setInterval` schedules, and
     * to bring focus to a starting HTML element if appropriate.
     */
    protected __abstractOnBeforeEnter(): void {}

}
export namespace SkScreen {

    export const enum Name {
        HOME,
        GAME_SETUP,
        SESSION_JOINER,
        HOW_TO_PLAY,
        HOW_TO_HOST,
        PLAY_GAME,
    }
}
Object.freeze(SkScreen);
Object.freeze(SkScreen.prototype);


export class AllSkScreens {

    private readonly dict: Readonly<Record<string, SkScreen>>;

    #currentScreen: SkScreen;

    public constructor(baseElem: HTMLElement) {
        const p = baseElem;
        const f = this.goToScreen;
        this.dict = Object.freeze({
            [ SkScreen.Name.HOME            ]:          new HomeScreen(p,f),
            [ SkScreen.Name.GAME_SETUP      ]:     new GameSetupScreen(p,f),
            [ SkScreen.Name.SESSION_JOINER  ]: new SessionJoinerScreen(p,f),
            [ SkScreen.Name.HOW_TO_PLAY     ]:     new HowToPlayScreen(p,f),
            [ SkScreen.Name.HOW_TO_HOST     ]:     new HowToHostScreen(p,f),
            [ SkScreen.Name.PLAY_GAME       ]:      new PlayGameScreen(p,f),
        });
    }

    public goToScreen(dest: SkScreen): void {
        if (this.currentScreen === dest) {
            // I don't see why this would ever need to happen.
            throw new Error ("never happens. see comment in source.");
        }
        this.currentScreen.leave();
        dest.enter();
        this.#currentScreen = dest;
    }

    public get currentScreen(): SkScreen {
        return this.#currentScreen;
    }
}
Object.freeze(AllSkScreens);
Object.freeze(AllSkScreens.prototype);
