import { OmHooks } from "defs/OmHooks";
import type { OfflineGame } from "../../game/OfflineGame";
import type { OnlineGame }  from "../../game/OnlineGame";

import { SkScreen } from "../SkScreen";


type Game = (OfflineGame<any> | OnlineGame<any>);
type SID_options = SkScreen.Id.PLAY_OFFLINE | SkScreen.Id.PLAY_ONLINE;

/**
 * If and only if this screen is the current screen, then its
 * `currentGame` property is defined, although it is not recommended
 * to manage its state except through this class' wrapper methods,
 * which are bound to buttons and maintain other invariants between
 * the game's state and the UI's state.
 */
// TODO.impl change the document title base on game state.
// TODO.impl Allow users to change the spotlight radius via slider.
export abstract class __PlayScreen<SID extends SID_options> extends SkScreen<SID> {

    /**
     * Hosts the implementation-specific grid element, as well as some
     * other overlays.
     */
    protected readonly gridElem: HTMLElement;

    private readonly playersBar: HTMLElement;

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
    #currentGame: Game | undefined;

    protected abstract readonly wantsAutoPause: boolean;
    /**
     * Automatically added and removed from listeners when entering
     * and leaving this screen.
     */
    readonly #onVisibilityChange: VoidFunction;
    /**
     * Automatically added and removed from listeners when entering
     * and leaving this screen.
     */
    readonly #gridOnKeyDown: (ev: KeyboardEvent) => boolean;
    /**
     * Undefined when the game is playing.
     */
    #pauseReason: "page-hide" | "other" | undefined;


    /**
     * @override
     */
    protected __lazyLoad(): void {
        this.baseElem.classList.add(OmHooks.Screen.Impl.PlayGame.Class.BASE);

        const centerColItems = __PlayScreen.createCenterColElem();
        (this.gridElem as HTMLElement) = centerColItems.gridElem;
        this.baseElem.appendChild(centerColItems.baseElem);
        // ^Purposely make the grid the first child so it gets tabbed to first.

        this.initializeControlsBar();
        this.initializePlayersBar();

        // @ts-ignore Assignment to readonly property.
        // We can't use a type assertion to cast off the readonly-ness
        // because it messed up the transpilation for #private fields.
        this.#onVisibilityChange = () => {
            if (!this.wantsAutoPause) return;
            if (document.hidden) {
                if (this.#pauseReason === undefined) this.statusBecomePaused();
            } else {
                if (this.#pauseReason === "page-hide") this.statusBecomePlaying();
            }
        }
        // @ts-ignore Assignment to readonly property.
        // See above note.
        this.#gridOnKeyDown = this.__gridKeyDownCallback.bind(this);
    }

    /**
     * @override
     */
    protected async __abstractOnBeforeEnter(args: SkScreen.CtorArgs<SID>): Promise<void> {
        document.addEventListener("visibilitychange", this.#onVisibilityChange);
        this.pauseButton.disabled = true;
        this.statusBecomePaused(); // <-- Leverage some state initialization.

        // TODO.design Are there ways we can share more code between
        // implementations by passing common arguments?
        this.#currentGame = await this.__createNewGame();
        this.gridElem.addEventListener("keydown", this.#gridOnKeyDown);
        await this.currentGame!.reset();
        // ^Wait until resetting has finished before attaching the
        // grid element to the screen so that the DOM changes made
        // by populating tiles with CSP's can be done all at once.
        const html = this.currentGame!.htmlElements;
        this.gridElem.insertAdjacentElement("afterbegin", html.gridImpl);
        // ^The order of insertion does not matter (it used to).
        this.playersBar.appendChild(html.playersBar);

        this.pauseButton.onclick = this.statusBecomePlaying.bind(this);
        this.pauseButton.disabled = false;
        if (this.wantsAutoPause) {
            setTimeout(() => {
                if (!document.hidden) this.statusBecomePlaying();
            }, 500);
        }
        return;
    }

    /**
     * @override
     */
    protected __abstractOnBeforeLeave(): boolean {
        if (!window.confirm("Are you sure you would like to leave?")) {
            return false;
        }
        document.removeEventListener("visibilitychange", this.#onVisibilityChange);

        // Release the game:
        for (const elem of Object.values(this.currentGame!.htmlElements)) {
            elem.remove();
        }
        this.gridElem.removeEventListener("keydown", this.#gridOnKeyDown);
        this.#currentGame = undefined;
        return true;
    }


    public get currentGame(): Game | undefined {
        return this.#currentGame;
    }

    protected abstract async __createNewGame(): Promise<Game>;


    /**
     * Do not use this directly. See `this.#gridOnKeyDown`.
     *
     * Note the uses of typescript `!` assertion instead of the nullish
     * coalescing operator for `this.currentGame`. This is safe because
     * this callback is managed by the screen-enter and leave hooks to
     * only be registered when the current game is defined, since it
     * doesn't make sense to be called when the game is not defined.
     *
     * @param ev -
     */
    private __gridKeyDownCallback(ev: KeyboardEvent): boolean {
        // console.log(`key: ${ev.key}, code: ${ev.code},`
        // + ` keyCode: ${ev.keyCode}, char: ${ev.char},`
        // + ` charCode: ${ev.charCode}`);
        const game = this.currentGame!;
        if (ev.ctrlKey && ev.key === " " && !ev.repeat) {
            // If switching operator:
            const operators = game.operators;
            game.setCurrentOperator(
                (operators.indexOf(game.currentOperator) + 1)
                % operators.length
            );
        } else {
            // Process event as regular typing:
            game.currentOperator.processKeyboardInput(ev);
        }
        // Disable scroll-down via spacebar:
        if (ev.key === " ") {
            ev.preventDefault();
            return false;
        }
        return true;
    }


    private statusBecomePlaying(): void {
        const OHGD = OmHooks.Grid.Dataset.GAME_STATE;
        this.currentGame?.statusBecomePlaying();
        this.pauseButton.textContent = "Pause";
        this.#pauseReason = undefined;
        this.gridElem.dataset[OHGD.KEY] = OHGD.VALUES.PLAYING;

        window.requestAnimationFrame((time) => {
            this.pauseButton.onclick = this.statusBecomePaused.bind(this);
            this.resetButton.disabled = true;
            this.gridElem.focus();
        });
    }

    private statusBecomePaused(): void {
        const OHGD = OmHooks.Grid.Dataset.GAME_STATE;
        this.currentGame?.statusBecomePaused();
        this.pauseButton.textContent = "Unpause";
        this.#pauseReason = document.hidden ? "page-hide" : "other";
        this.gridElem.dataset[OHGD.KEY] = OHGD.VALUES.PAUSED;

        this.pauseButton.onclick    = this.statusBecomePlaying.bind(this);
        this.resetButton.disabled   = false;
    }

    // TODO.impl pass this to the created game.
    public __onGameBecomeOver(): void {
        const OHGD = OmHooks.Grid.Dataset.GAME_STATE;
        this.pauseButton.disabled = true;
        this.gridElem.dataset[OHGD.KEY] = OHGD.VALUES.OVER;
    }

    /**
     * Should only be called if all the following conditions are met:
     * - The current game exists.
     * - The current game is paused or it is over.
     */
    private __resetGame(): void {
        this.currentGame!.reset();
        this.pauseButton.disabled = false;
        if (this.wantsAutoPause) {
            this.statusBecomePlaying();
        }
    }


    /**
     *
     */
    protected initializeControlsBar(): void {
        const controlsBar = document.createElement("div");
        controlsBar.classList.add(
            OmHooks.General.Class.INPUT_GROUP,
            OmHooks.Screen.Impl.PlayGame.Class.CONTROLS_BAR,
        );
        controlsBar.setAttribute("role", "menu");

        function createControlButton(buttonText: string): HTMLButtonElement {
            const button = document.createElement("button");
            button.textContent = buttonText;
            button.classList.add(OmHooks.General.Class.INPUT_GROUP_ITEM);
            button.addEventListener("pointerenter", (ev) => {
                window.requestAnimationFrame((time) => {
                    button.focus();
                });
            });
            controlsBar.appendChild(button);
            return button;
        }
        controlsBar.addEventListener("pointerleave", (ev) => {
            window.requestAnimationFrame((time) => {
                this.gridElem.focus();
            });
        });

        { const bth
            = (this.backToHomeButton as HTMLButtonElement)
            = createControlButton("Return To Homepage");
        bth.onclick = this.requestGoToScreen.bind(this, SkScreen.Id.HOME);
        }

        { const pause
            = (this.pauseButton as HTMLButtonElement)
            = createControlButton("");
        }

        { const reset
            = (this.resetButton as HTMLButtonElement)
            = createControlButton("Reset");
        reset.onclick = this.__resetGame.bind(this);
        }

        this.baseElem.appendChild(controlsBar);
    }

    protected initializePlayersBar(): void {
        const playersBar
            = (this.playersBar as HTMLElement)
            = document.createElement("div");
        playersBar.classList.add(OmHooks.Screen.Impl.PlayGame.Class.PLAYERS_BAR);
        this.baseElem.appendChild(playersBar);
    }
}
export namespace __PlayScreen {
    /**
     *
     */
    export function createCenterColElem():
    { baseElem: HTMLElement, gridElem: HTMLElement, }
    {
        const CssFx = OmHooks.General.Class;
        const centerColElem = document.createElement("div");
        centerColElem.classList.add(
            CssFx.CENTER_CONTENTS,
            OmHooks.Screen.Impl.PlayGame.Class.GRID_CONTAINER,
        );
        const gridElem = document.createElement("div");
        gridElem.tabIndex = 0; // <-- allow focusing this element.
        gridElem.setAttribute("role", "textbox");
        gridElem.setAttribute("aria-label", "Game Grid");
        gridElem.classList.add(
            CssFx.CENTER_CONTENTS,
            CssFx.STACK_CONTENTS,
            CssFx.TEXT_SELECT_DISABLED,
            OmHooks.Grid.Class.GRID,
        );
        {
            // Add a "keyboard-disconnected" overlay if not added already:
            const kbdDcBase = document.createElement("div");
            kbdDcBase.classList.add(
                CssFx.CENTER_CONTENTS,
                OmHooks.Grid.Class.KBD_DC,
            );
            // TODO.impl Add an <svg> with icon instead please.
            {
                const kbdDcIcon = document.createElement("div");
                kbdDcIcon.classList.add(OmHooks.Grid.Class.KBD_DC_ICON);
                kbdDcIcon.textContent = "(click here to continue typing)";
                kbdDcBase.appendChild(kbdDcIcon);
            }
            gridElem.appendChild(kbdDcBase);
        } {
            // Add a "keyboard-disconnected" overlay if not added already:
            const pauseOl = document.createElement("div");
            pauseOl.classList.add(
                CssFx.CENTER_CONTENTS,
                OmHooks.Grid.Class.PAUSE_OL,
            );
            // TODO.impl Add an <svg> with icon instead please.
            {
                const pauseIcon = document.createElement("div");
                pauseIcon.classList.add(OmHooks.Grid.Class.PAUSE_OL_ICON);
                pauseIcon.textContent = "(The Game is Paused)";
                pauseOl.appendChild(pauseIcon);
            }
            gridElem.appendChild(pauseOl);
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
