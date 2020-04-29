import { OmHooks } from "defs/OmHooks";
import type { OfflineGame } from "../../game/OfflineGame";
import type { OnlineGame }  from "../../game/OnlineGame";

import { SkScreen } from "../SkScreen";

type Game = (OfflineGame<any> | OnlineGame<any>);

/**
 *
 */
// TODO: make a hook in the Game class hierarchy that gets called when the game is over
// so that we can disable the pause button.
export abstract class __PlayScreen extends SkScreen {

    protected readonly gridElem: HTMLElement;

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

    #currentGame: Game | undefined;


    protected __lazyLoad(): void {
        const centerColElems = __PlayScreen.createCenterColElem(this.gridKeyDownCallback.bind(this));
        this.baseElem.appendChild(centerColElems.baseElem);
        (this.gridElem as HTMLElement) = centerColElems.gridElem;

        (this.pauseButton as HTMLButtonElement) = document.createElement("button");
        this.baseElem.appendChild(this.pauseButton);

        (this.resetButton as HTMLButtonElement) = document.createElement("button");
        this.resetButton.innerText = "Reset";
        this.baseElem.appendChild(this.resetButton);

        // Leverage some state initialization:
        this.statusBecomePaused();
    }

    protected __abstractOnBeforeEnter(): void {
        // TODO.design Are there ways we can share more code between
        // implementations by passing arguments?
        (async () => {
            this.pauseButton.disabled = true;
            this.#currentGame = await this.__createNewGame();

            const resetPromise = this.currentGame!.reset();
            this.gridElem.insertAdjacentElement("afterbegin", this.currentGame!.htmlElements.gridImplElem);
            // ^The order it is inserted into does not actually matter (it used to).

            await resetPromise;
            this.pauseButton.onclick = this.statusBecomePlaying.bind(this);
            this.pauseButton.disabled = false;
        })();
    }

    protected __abstractOnBeforeLeave(): boolean {
        if (!window.confirm("Are you sure you would like to leave?")) {
            return false;
        }
        this.destroyCurrentGame();
        return true;
    }


    public get currentGame(): Game | undefined {
        return this.#currentGame;
    }

    protected abstract async __createNewGame(): Promise<Game>;

    protected destroyCurrentGame(): void {
        this.currentGame!.grid.baseElem.remove();
    }


    private gridKeyDownCallback(ev: KeyboardEvent): boolean {
        // console.log(`key: ${ev.key}, code: ${ev.code},`
        // + ` keyCode: ${ev.keyCode}, char: ${ev.char},`
        // + ` charCode: ${ev.charCode}`);
        this.currentGame?.currentOperator.processKeyboardInput(ev);
        // Disable scroll-down via spacebar:
        if (ev.keyCode === 32) {
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
}
export namespace __PlayScreen {

    /**
     *
     */
    export function createCenterColElem(
        gridKeyDownCallback: GlobalEventHandlers["onkeydown"],
    ): { baseElem: HTMLElement, gridElem: HTMLElement, }
    {
        const centerColElem = document.createElement("div");
        centerColElem.classList.add(
            OmHooks.Screen.Impl.PlayGame.Class.GRID_CONTAINER,
            OmHooks.General.Class.CENTER_CONTENTS,
        );
        const gridElem = document.createElement("div");
        gridElem.tabIndex = 0; // <-- allow focusing this element.
        gridElem.classList.add(
            OmHooks.Grid.Class.GRID,
            OmHooks.General.Class.TEXT_SELECT_DISABLED,
            OmHooks.General.Class.CENTER_CONTENTS,
            OmHooks.General.Class.STACK_CONTENTS,
        );
        gridElem.onkeydown = gridKeyDownCallback;
        {
            // Add a "keyboard-disconnected" overlay if not added already:
            const kbdDcBase = document.createElement("div");
            kbdDcBase.classList.add(
                OmHooks.Grid.Class.KBD_DC_BASE,
                OmHooks.General.Class.CENTER_CONTENTS,
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
