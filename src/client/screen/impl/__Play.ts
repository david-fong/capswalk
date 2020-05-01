import { OmHooks } from "defs/OmHooks";
import type { OfflineGame } from "../../game/OfflineGame";
import type { OnlineGame }  from "../../game/OnlineGame";

import { SkScreen } from "../SkScreen";


type Game = (OfflineGame<any> | OnlineGame<any>);

/**
 * If and only if this screen is the current screen, then its
 * `currentGame` property is defined, although it is not recommended
 * to manage its state except through this class' wrapper methods,
 * which are bound to buttons and maintain other invariants between
 * the game's state and the UI's state.
 */
// TODO: make a hook in the Game class hierarchy that gets called when the game is over
// so that we can disable the pause button.
export abstract class __PlayScreen extends SkScreen {

    protected readonly gridElem: HTMLElement;

    private readonly backToHomeButton: HTMLButtonElement;

    /**
     * Must be disabled when
     * - The game does not exist.
     * - The game is over.
     */
    private readonly pauseButton: HTMLButtonElement;
    /**
     * Must be disabled when
     * - The game does not exist.
     * - The game is playing.
     */
    private readonly resetButton: HTMLButtonElement;

    /**
     * This field is defined when this is the current screen, and next
     * to all code here will only run when this screen is the current
     * screen, but I have annotated the type as possibly undefined just
     * so there's no question that it can, under certain conditions be
     * undefined.
     */
    #currentGame: Game| undefined;


    /**
     * @override
     */
    protected __lazyLoad(): void {
        const centerColItems = __PlayScreen.createCenterColElem(this.gridKeyDownCallback.bind(this));
        (this.gridElem as HTMLElement) = centerColItems.gridElem;
        this.baseElem.appendChild(centerColItems.baseElem);
        // ^Purposely make the grid the first child so it gets tabbed to first.

        this.initializeControlsBar();
        this.initializeScoresBar();

        // Leverage some state initialization:
        this.statusBecomePaused();
    }

    /**
     * @override
     */
    protected __abstractOnBeforeEnter(): void {
        // TODO.design Are there ways we can share more code between
        // implementations by passing arguments?
        (async () => {
            this.pauseButton.disabled = true;
            this.#currentGame = await this.__createNewGame();

            const resetPromise = this.currentGame!.reset();
            this.gridElem.insertAdjacentElement("afterbegin",
                this.currentGame!.htmlElements.gridImplElem,
            );
            // ^The order of insertion does not matter (it used to).

            await resetPromise;
            this.pauseButton.onclick = this.statusBecomePlaying.bind(this);
            this.pauseButton.disabled = false;

            // Automatically start the game upon entering this screen:
            this.pauseButton.click();
        })();
    }

    /**
     * @override
     */
    protected __abstractOnBeforeLeave(): boolean {
        if (!window.confirm("Are you sure you would like to leave?")) {
            return false;
        }
        this.releaseCurrentGame();
        return true;
    }


    public get currentGame(): Game | undefined {
        return this.#currentGame;
    }

    protected abstract async __createNewGame(): Promise<Game>;

    protected releaseCurrentGame(): void {
        for (const elem of Object.values(this.currentGame!.htmlElements)) {
            elem.remove();
        }
        this.#currentGame = undefined;
    }


    private gridKeyDownCallback(ev: KeyboardEvent): boolean {
        // console.log(`key: ${ev.key}, code: ${ev.code},`
        // + ` keyCode: ${ev.keyCode}, char: ${ev.char},`
        // + ` charCode: ${ev.charCode}`);
        this.currentGame?.currentOperator.processKeyboardInput(ev);
        // Disable scroll-down via spacebar:
        if (ev.key === " ") {
            ev.preventDefault();
            return false;
        }
        return true;
    }

    // TODO.impl bind this to a button and, for offline games, also
    // to an event listener called when the page loses focus.
    private statusBecomePlaying(): void {
        this.currentGame?.statusBecomePlaying();
        this.pauseButton.innerText  = "Pause";
        this.pauseButton.onclick    = this.statusBecomePaused.bind(this);
        this.resetButton.disabled   = true;
        this.gridElem.focus();
    }

    private statusBecomePaused(): void {
        this.currentGame?.statusBecomePaused();
        this.pauseButton.innerText  = "Unpause";
        this.pauseButton.onclick    = this.statusBecomePlaying.bind(this);
        this.resetButton.disabled   = false;
    }

    /**
     * Should only be called if all the following conditions are met:
     * - The current game exists.
     * - The current game is paused or it is over.
     */
    private __resetGame(): void {
        this.currentGame!.reset();
    }

    protected initializeControlsBar(): void {
        const controlsBar = document.createElement("div");
        controlsBar.classList.add(
            OmHooks.Screen.Impl.PlayGame.Class.CONTROLS_BAR,
        );

        { const bth
            = (this.backToHomeButton as HTMLButtonElement)
            = document.createElement("button");
        bth.innerText = "Return To Homepage";
        bth.onclick = this.requestGoToScreen.bind(this, SkScreen.Id.HOME);
        controlsBar.appendChild(bth); }

        { const pause
            = (this.pauseButton as HTMLButtonElement)
            = document.createElement("button");
        controlsBar.appendChild(pause); }

        { const reset
            = (this.resetButton as HTMLButtonElement)
            = document.createElement("button");
        reset.innerText = "Reset";
        reset.onclick = this.__resetGame.bind(this);
        controlsBar.appendChild(reset); }

        this.baseElem.appendChild(controlsBar);
    }

    protected initializeScoresBar(): void {
        ;
    }
}
export namespace __PlayScreen {
    /**
     *
     */
    export function createCenterColElem(
        gridKeyDownCallback: GlobalEventHandlers["onkeydown"],
    ): { baseElem: HTMLElement, gridElem: HTMLElement, }
    {
        const CssFx = OmHooks.General.Class;
        const centerColElem = document.createElement("div");
        centerColElem.classList.add(
            CssFx.CENTER_CONTENTS,
            OmHooks.Screen.Impl.PlayGame.Class.GRID_CONTAINER,
        );
        const gridElem = document.createElement("div");
        gridElem.tabIndex = 0; // <-- allow focusing this element.
        gridElem.classList.add(
            CssFx.CENTER_CONTENTS,
            CssFx.STACK_CONTENTS,
            CssFx.TEXT_SELECT_DISABLED,
            OmHooks.Grid.Class.GRID,
        );
        gridElem.onkeydown = gridKeyDownCallback;
        {
            // Add a "keyboard-disconnected" overlay if not added already:
            const kbdDcBase = document.createElement("div");
            kbdDcBase.classList.add(
                CssFx.CENTER_CONTENTS,
                OmHooks.Grid.Class.KBD_DC_BASE,
            );
            // TODO.impl Add an <svg> with icon instead please.
            {
                const kbdDcIcon = document.createElement("div");
                kbdDcIcon.classList.add(OmHooks.Grid.Class.KBD_DC_ICON);
                kbdDcIcon.innerText = "(click here to continue typing)";
                kbdDcBase.appendChild(kbdDcIcon);
            }
            gridElem.appendChild(kbdDcBase);
        }
        centerColElem.appendChild(gridElem);

        return Object.freeze({
            baseElem: centerColElem,
            gridElem,
        });
    }
}
Object.freeze(__PlayScreen);
Object.freeze(__PlayScreen.prototype);