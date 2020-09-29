import { Game } from "game/Game"; export { Game };
import { SCROLL_INTO_CENTER } from "defs/TypeDefs";
// import type { OfflineGame } from "../../game/OfflineGame";
// import type { OnlineGame }  from "../../game/OnlineGame";
import type { BrowserGameMixin } from "../../game/BrowserGame";

import { OmHooks, SkScreen } from "../SkScreen";

/**
 * If and only if this screen is the current screen, then its
 * `currentGame` property is defined, although it is not recommended
 * to manage its state except through this class' wrapper methods,
 * which are bound to buttons and maintain other invariants between
 * the game's state and the UI's state.
 */
// TODO.impl Allow users to change the spotlight radius and grid zoom via slider.
export abstract class _PlayScreen<
    SID extends SkScreen.Id.PLAY_OFFLINE | SkScreen.Id.PLAY_ONLINE,
    G extends Game.Type.Browser,
    Game extends BrowserGameMixin<G,any> = BrowserGameMixin<G,any>,
> extends SkScreen<SID> {

    /**
     * Hosts the implementation-specific grid element's scroll-wrapper,
     * as well as some other game-status overlays.
     */
    protected readonly _gridBaseElem: HTMLElement;
    private   readonly _gridImplHost: HTMLElement;
    //private   readonly _gridIsecObserver: IntersectionObserver;

    private readonly playersBar: HTMLElement;

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
    // #currentGame: undefined | any extends G ? never : {[G_ in G]:
    //       G extends Game.Type.OFFLINE ? OfflineGame<any>
    //     : G extends Game.Type.ONLINE  ? OnlineGame<any>
    //     : never
    // }[G];
    #currentGame: undefined | Game;

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
    protected _lazyLoad(): void {
        this.baseElem.classList.add(
            OmHooks.General.Class.CENTER_CONTENTS,
            OmHooks.Screen.Impl.Play.Class.BASE,
        );

        const gridHtml = _PlayScreen.createCenterColElem();
        (this._gridBaseElem as HTMLElement) = gridHtml.grid;
        (this._gridImplHost as HTMLElement) = gridHtml.implHost;
        this._gridImplHost.appendChild(document.createComment("grid impl host"));
        this.baseElem.appendChild(gridHtml.top);
        gridHtml.pauseOl.addEventListener("click", (ev) => {
            const game = this.currentGame;
            if (game && game.status === Game.Status.PAUSED) {
                this._statusBecomePlaying();
            }
        });
        // ^Purposely make the grid the first child so it gets tabbed to first.

        // See below link for an illustrative guide on the intersection observer API:
        // https://blog.arnellebalane.com/the-intersection-observer-api-d441be0b088d
        // Unfortunately, it seems like intersection observer is not able to do what
        // I want. It will no trigger when the target's position changes.
        // // @ts-expect-error Assignment to readonly property: `_gridIsecObserver`:
        // this._gridIsecObserver = new IntersectionObserver((entries, observer) => {
        //     entries.forEach((value) => {
        //         console.log(value.intersectionRatio);
        //         if (!value.isIntersecting) {
        //             value.target.scrollIntoView(SCROLL_INTO_CENTER);
        //         }
        //     });
        // }, {
        //     root: gridHtml.intersectionRoot,
        //     rootMargin: "-20%",
        // });

        this._initializeControlsBar();
        this._initializePlayersBar();

        // @ts-expect-error Assignment to readonly property.
        // We can't use a type assertion to cast off the readonly-ness
        // because it messed up the transpilation for #private fields.
        this.#onVisibilityChange = () => {
            if (!this.wantsAutoPause) return;
            if (document.hidden) {
                if (this.#pauseReason === undefined) {
                    const game = this.currentGame;
                    if (!game || (game && game.status !== Game.Status.OVER)) {
                        this._statusBecomePaused();
                    }
                }
            } else {
                if (this.#pauseReason === "page-hide") { this._statusBecomePlaying(); }
            }
        };
        // @ts-expect-error Assignment to readonly property.
        // See above note.
        this.#gridOnKeyDown = this._gridKeyDownCallback.bind(this);
    }

    /**
     * @override
     */
    protected async _abstractOnBeforeEnter(args: SkScreen.EntranceArgs[SID]): Promise<void> {
        document.addEventListener("visibilitychange", this.#onVisibilityChange);
        this.pauseButton.disabled = true;
        this._statusBecomePaused(); // <-- Leverage some state initialization.

        this.#currentGame = await this._createNewGame(
            args as (typeof args & Game.CtorArgs<G,any>),
        );
        this._gridBaseElem.addEventListener("keydown", this.#gridOnKeyDown);
        await this.currentGame!.reset();
        // ^Wait until resetting has finished before attaching the
        // grid element to the screen so that the DOM changes made
        // by populating tiles with CSP's will be batched.
        const html = this.currentGame!.htmlElements;
        this._gridImplHost.appendChild(html.gridImpl);
        // ^The order of insertion does not matter (it used to).
        this.playersBar.appendChild(html.playersBar);

        this.pauseButton.onclick = this._statusBecomePlaying.bind(this);
        this.pauseButton.disabled = false;
        if (this.wantsAutoPause) {
            setTimeout(() => {
                if (!document.hidden) { this._statusBecomePlaying(); }
            }, 500);
            // ^This delay is for "aesthetic" purposes (not functional).
        }
        return;
    }

    /**
     * @override
     */
    protected _abstractOnBeforeLeave(): boolean {
        if (!window.confirm("Are you sure you would like to leave?")) {
            return false;
        }
        document.removeEventListener("visibilitychange", this.#onVisibilityChange);
        //this._gridIsecObserver.disconnect();

        // Release the game:
        // See docs in Game.ts : Pausing is done to cancel scheduled callbacks.
        const game = this.currentGame!;
        game.statusBecomePaused();
        for (const elem of Object.values(game.htmlElements)) {
            // IMPORTANT NOTE: For some reason, clearing children from the
            // grid-impl element is necessary to allow for garbage collection
            // of DOM nodes (at least on Chrome).
            elem.textContent = "";
            elem.remove();
        }
        this._gridBaseElem.removeEventListener("keydown", this.#gridOnKeyDown);
        //// @ts-expect-error Experiment with freeing grid reference to speed up garbage collection?
        //game.grid = undefined;
        this.#currentGame = undefined;
        return true;
    }


    public get currentGame(): Game | undefined {
        return this.#currentGame;
    }

    protected abstract async _createNewGame(ctorArgs: Game.CtorArgs<G,any>): Promise<Game>;


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
    private _gridKeyDownCallback(ev: KeyboardEvent): boolean {
        // console.log(`key: ${ev.key}, code: ${ev.code},`
        // + ` keyCode: ${ev.keyCode}, char: ${ev.char},`
        // + ` charCode: ${ev.charCode}`);
        const game = this.currentGame!;
        if (ev.ctrlKey && ev.key === " " && !ev.repeat) {
            // If switching operator:
            function getOperatorElem(this: void): HTMLElement {
                return game.currentOperator.status.immigrantInfo.playerElem;
            };
            //this._gridIsecObserver.unobserve(getOperatorElem());
            const operators = game.operators;
            game.setCurrentOperator(
                (1 + operators.indexOf(game.currentOperator))
                % operators.length
            );
            //const operatorElem = getOperatorElem();
            //this._gridIsecObserver.observe(operatorElem);
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


    private _statusBecomePlaying(): void {
        const OHGD = OmHooks.Grid.Dataset.GAME_STATE;
        this.currentGame?.statusBecomePlaying();
        this.pauseButton.textContent = "Pause";
        this.#pauseReason = undefined;
        this._gridBaseElem.dataset[OHGD.KEY] = OHGD.VALUES.PLAYING;

        window.requestAnimationFrame((time) => {
            this.pauseButton.onclick = this._statusBecomePaused.bind(this);
            this.resetButton.disabled = true;
            this._gridBaseElem.focus();
        });
    }

    private _statusBecomePaused(): void {
        const OHGD = OmHooks.Grid.Dataset.GAME_STATE;
        this.currentGame?.statusBecomePaused();
        this.pauseButton.textContent = "Unpause";
        this.#pauseReason = document.hidden ? "page-hide" : "other";
        this._gridBaseElem.dataset[OHGD.KEY] = OHGD.VALUES.PAUSED;

        this.pauseButton.onclick    = this._statusBecomePlaying.bind(this);
        this.resetButton.disabled   = false;
    }

    protected _onGameBecomeOver(): void {
        const OHGD = OmHooks.Grid.Dataset.GAME_STATE;
        this.pauseButton.disabled = true;
        this.resetButton.disabled = false;
        this._gridBaseElem.dataset[OHGD.KEY] = OHGD.VALUES.OVER;
    }

    /**
     * Should only be called if all the following conditions are met:
     * - The current game exists.
     * - The current game is paused or it is over.
     */
    private _resetGame(): void {
        this.currentGame!.reset();
        this.pauseButton.disabled = false;
        if (this.wantsAutoPause) {
            this._statusBecomePlaying();
        }
    }


    /**
     *
     */
    private _initializeControlsBar(): void {
        const controlsBar = document.createElement("div");
        controlsBar.classList.add(
            OmHooks.General.Class.CENTER_CONTENTS,
            OmHooks.General.Class.INPUT_GROUP,
            OmHooks.Screen.Impl.Play.Class.CONTROLS_BAR,
        );
        controlsBar.setAttribute("role", "menu");

        function createControlButton(buttonText: string, button?: HTMLButtonElement): HTMLButtonElement {
            button = button ?? document.createElement("button");
            button.textContent = buttonText;
            button.classList.add(OmHooks.General.Class.INPUT_GROUP_ITEM);
            button.addEventListener("pointerenter", (ev) => {
                window.requestAnimationFrame((time) => {
                    button!.focus();
                });
            });
            controlsBar.appendChild(button);
            return button;
        }
        controlsBar.addEventListener("pointerleave", (ev) => {
            window.requestAnimationFrame((time) => {
                this._gridBaseElem.focus();
            });
        });

        { const bth = createControlButton("Return To Homepage", this.nav.prev);
        bth.onclick = this.requestGoToScreen.bind(this, SkScreen.Id.HOME, {});
        }

        { const pause
            = (this.pauseButton as HTMLButtonElement)
            = createControlButton("");
        }

        { const reset
            = (this.resetButton as HTMLButtonElement)
            = createControlButton("Reset");
        reset.onclick = this._resetGame.bind(this);
        }

        this.baseElem.appendChild(controlsBar);
    }

    private _initializePlayersBar(): void {
        const playersBar
            = (this.playersBar as HTMLElement)
            = document.createElement("div");
        playersBar.classList.add(OmHooks.Screen.Impl.Play.Class.PLAYERS_BAR);
        this.baseElem.appendChild(playersBar);
    }
}
export namespace _PlayScreen {
    /**
     *
     */
    export function createCenterColElem(): Readonly<{
        top: HTMLElement,
        grid: HTMLElement,
        intersectionRoot: HTMLElement,
        implHost: HTMLElement,
        pauseOl: HTMLElement,
    }> {
        const OMHC = OmHooks.Grid.Class;
        const CSS_FX = OmHooks.General.Class;

        const base = document.createElement("div");
        base.classList.add(OmHooks.Screen.Impl.Play.Class.GRID_WRAPPER);

        const grid = document.createElement("div");
        grid.tabIndex = 0; // <-- allow focusing this element.
        grid.setAttribute("role", "textbox");
        grid.setAttribute("aria-label", "Game Grid");
        grid.classList.add(
            //CSS_FX.CENTER_CONTENTS,
            CSS_FX.STACK_CONTENTS,
            CSS_FX.TEXT_SELECT_DISABLED,
            OMHC.GRID,
        );
        // Grid Scroll Wrapper:
        const scrollOuter = document.createElement("div");
        scrollOuter.setAttribute("role", "presentation");
        scrollOuter.classList.add(
            //CSS_FX.FILL_PARENT,
            OMHC.SCROLL_OUTER,
        );
        {
            // Add a "keyboard-disconnected" overlay if not added already:
            const kbdDcBase = document.createElement("div");
            kbdDcBase.classList.add(
                CSS_FX.FILL_PARENT,
                CSS_FX.CENTER_CONTENTS,
                OMHC.KBD_DC,
            );
            // TODO.impl Add an <svg> with icon instead please.
            {
                const kbdDcIcon = document.createElement("div");
                kbdDcIcon.classList.add(OMHC.KBD_DC_ICON);
                kbdDcIcon.textContent = "(click here to continue typing)";
                kbdDcBase.appendChild(kbdDcIcon);
            }
            scrollOuter.appendChild(kbdDcBase);
        }
        const pauseOl = document.createElement("div"); {
            // Add a "keyboard-disconnected" overlay if not added already:
            pauseOl.classList.add(
                CSS_FX.FILL_PARENT,
                CSS_FX.CENTER_CONTENTS,
                OMHC.PAUSE_OL,
            );
            // TODO.impl Add an <svg> with icon instead please.
            {
                const pauseIcon = document.createElement("div");
                pauseIcon.classList.add(OMHC.PAUSE_OL_ICON);
                pauseIcon.textContent = "(Click to Unpause)";
                pauseOl.appendChild(pauseIcon);
            }
            scrollOuter.appendChild(pauseOl);
        }
        // const intersectionRoot = document.createElement("div");
        // intersectionRoot.setAttribute("aria-hidden", "true");
        // intersectionRoot.classList.add(
        //     CSS_FX.FILL_PARENT,
        //     OMHC.PLAYER_IOB_ROOT,
        // );
        // scrollOuter.appendChild(intersectionRoot);

        grid.appendChild(scrollOuter);
        base.appendChild(grid);
        return Object.freeze(<ReturnType<typeof _PlayScreen.createCenterColElem>>{
            top: base,
            grid,
            intersectionRoot: scrollOuter,
            implHost: scrollOuter,
            pauseOl: pauseOl,
        });
    }
}
Object.freeze(_PlayScreen);
Object.freeze(_PlayScreen.prototype);