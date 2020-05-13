import { OmHooks } from "defs/OmHooks";
import type { AllSkScreens } from "./AllSkScreens";
import type { TopLevel } from "../TopLevel";


/**
 *
 *
 * NOTE: Design decision: Isolate from the rest of the architecture.
 * Ie. Do not give it circular / upward references to anything that
 * references it.
 */
export abstract class SkScreen<SID extends SkScreen.Id> {

    public readonly screenId: SID;

    protected readonly toplevel: TopLevel;

    readonly #parentElem: HTMLElement;

    protected readonly baseElem: HTMLElement;

    #hasLazyLoaded: boolean;

    /**
     * This should be `false` if the screen requires connection to a game server.
     */
    public abstract canBeInitialScreen: boolean;

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
        screenId: SID,
        toplevel: TopLevel,
        parentElem: HTMLElement,
        requestGoToDisplay: AllSkScreens["goToScreen"],
    ) {
        this.screenId           = screenId;
        this.toplevel           = toplevel;
        this.#parentElem        = parentElem;
        this.requestGoToScreen  = requestGoToDisplay;
        this.#hasLazyLoaded     = false;
    }

    /**
     * **Do not override.**
     */
    // TODO.learn https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState
    public async enter(args: SkScreen.CtorArgs<SID>): Promise<void> {
        if (!this.#hasLazyLoaded) {
            const baseElem
                = (this.baseElem as HTMLElement)
                = document.createElement("div");
            baseElem.classList.add(OmHooks.Screen.Class.BASE);
            this.__lazyLoad();
            this.#parentElem.appendChild(baseElem);
            const spaceyCamelName = this.screenId.replace(/[A-Z]/g, (letter) => " " + letter);
            { // "<SCREEN NAME> SCREEN"
                const str = spaceyCamelName.toUpperCase();
                baseElem.insertAdjacentHTML("beforebegin", `<!-- ${str} SCREEN -->`)
            }{ // "<Screen Name> Screen"
                const str = spaceyCamelName.split(' ').map((word) =>
                    word.charAt(0).toUpperCase()
                    + word.substring(1)).join(' ');
                baseElem.setAttribute("aria-label", str + " Screen");
            }
            this.#hasLazyLoaded = true;
        }
        const location = new window.URL(window.location.href);
        location.hash = this.screenId;
        history.replaceState(null, "", location.href);
        await this.__abstractOnBeforeEnter(args);
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
     * Implementations should set the CSS class for the base element.
     */
    protected abstract __lazyLoad(): void;

    /**
     * This is a good place to start any `setInterval` schedules, and
     * to bring focus to a starting HTML element if appropriate.
     *
     * The default implementation does nothing. Overriding implementations
     * from direct subclasses can safely skip making a supercall.
     */
    protected async __abstractOnBeforeEnter(args: SkScreen.CtorArgs<SID>): Promise<void> { }

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

    export type CtorArgs<SID_group extends SkScreen.Id>
    = any extends SID_group ? never
    : { [SID in SID_group]:
        /* : */ SID extends SkScreen.Id ? {}
        // ^Placeholder for screens that don't
        // require any entrance arguments.
        : never
    }[SID_group];
}
Object.freeze(SkScreen);
Object.freeze(SkScreen.prototype);
