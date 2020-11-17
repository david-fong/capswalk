import { Game } from "game/Game"; export { Game };
import { SCROLL_INTO_CENTER } from "defs/TypeDefs";
// import type { OfflineGame } from "../../game/OfflineGame";
// import type { OnlineGame }  from "../../game/OnlineGame";
import type { BrowserGameMixin } from "../../../game/BrowserGame";

import { JsUtils, OmHooks, Coord, SkScreen } from "../../SkScreen";
import CSS from "./style.m.css";
import GRID_CSS from "./grid.m.css";

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
    Game extends BrowserGameMixin<G,Coord.System> = BrowserGameMixin<G,Coord.System>,
> extends SkScreen<SID> {

    /**
     * Hosts the scroll-wrapper and game-status overlays.
     */
    private readonly grid: Readonly<{
        base: HTMLElement;
        implHost: HTMLElement;
        pauseOl: HTMLElement;
        //isecObserver: IntersectionObserver;
    }>;

    private readonly playersBar: HTMLElement;

    private readonly btn: Readonly<{
        /**
         * Must be disabled when
         * - The game does not exist.
         * - The game is over.
         */
        pause: HTMLButtonElement;
        /**
         * Must be disabled when
         * - The game does not exist.
         * - The game is playing.
         */
        reset: HTMLButtonElement;
    }>;

    /**
     * This field is defined when this is the current screen, and next
     * to all code here will only run when this screen is the current
     * screen, but I have annotated the type as possibly undefined just
     * so there's no question that it can, under certain conditions be
     * undefined.
     */
    #currentGame: undefined | Game;

    protected abstract readonly wantsAutoPlayPause: boolean;

    protected abstract readonly askConfirmBeforeLeave: boolean;
    /**
     * Automatically added and removed from listeners when entering
     * and leaving this screen.
     */
    readonly #onVisibilityChange: () => void;
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
            CSS["this"],
        );

        const _gridHtml = _PlayScreen.createGridWrapper();
        // @ts-expect-error : RO=
        this.grid = Object.freeze({
            base: _gridHtml.top,
            implHost: _gridHtml.implHost,
            pauseOl: _gridHtml.pauseOl,
        });
        JsUtils.propNoWrite(this as _PlayScreen<SID,G>, ["grid"]);
        JsUtils.prependComment(this.grid.implHost, "grid impl host");
        this.grid.implHost.appendChild(document.createComment("grid impl"));

        this.baseElem.appendChild(_gridHtml.top);
        _gridHtml.pauseOl.addEventListener("focus", (ev) => {
            const game = this.currentGame;
            if (game !== undefined && game.status === Game.Status.PAUSED) {
                this.grid.base.focus();
                this._requestStatusBecomePlaying();
            }
        });
        // ^Purposely make the grid the first child so it gets tabbed to first.

        // See below link for an illustrative guide on the intersection observer API:
        // https://blog.arnellebalane.com/the-intersection-observer-api-d441be0b088d
        // Unfortunately, it seems like intersection observer is not able to do what
        // I want. It will no trigger when the target's position changes.
        // // @ts-expect-error Assignment to readonly property: `_gridIsecObserver`:
        // this.grid.isecObserver = new IntersectionObserver((entries, observer) => {
        //     entries.forEach((value) => {
        //         console.log(value.intersectionRatio);
        //         if (!value.isIntersecting) {
        //             value.target.scrollIntoView(SCROLL_INTO_CENTER);
        //         }
        //     });
        // }, {
        //     root: _gridHtml.intersectionRoot,
        //     rootMargin: "-20%",
        // });

        this._initializeControlsBar();
        this._initializePlayersBar();

        // @ts-expect-error : RO=
        this.#onVisibilityChange = () => {
            if (!this.wantsAutoPlayPause) return;
            if (document.hidden) {
                if (this.#pauseReason === undefined) {
                    const game = this.currentGame;
                    if (game === undefined || (game !== undefined && game.status !== Game.Status.OVER)) {
                        this._requestStatusBecomePaused();
                    }
                }
            } else {
                if (this.#pauseReason === "page-hide") { this._requestStatusBecomePlaying(); }
            }
        };
        // @ts-expect-error : RO=
        this.#gridOnKeyDown = this._gridKeyDownCallback.bind(this);
    }

    /**
     * @override
     */
    protected async _abstractOnBeforeEnter(
        navDir: SkScreen.NavDir,
        args: SkScreen.EntranceArgs[SID],
    ): Promise<void> {
        document.addEventListener("visibilitychange", this.#onVisibilityChange);
        this.btn.pause.disabled = true;
        this._statusBecomePaused(); // <-- Leverage some state initialization.

        this.#currentGame = await this._createNewGame(
            args as Game.CtorArgs<G,Coord.System>,
        );
        this.grid.base.addEventListener("keydown", this.#gridOnKeyDown, {
            // the handler will call stopPropagation. As a result,
            // nothing inside this element can ever receive keyboard events.
            capture: true,
        });
        await this.currentGame.reset();
        // ^Wait until resetting has finished before attaching the
        // grid element to the screen so that the DOM changes made
        // by populating tiles with CSP's will be batched.
        this.grid.implHost.appendChild(this.currentGame.htmlElements.gridImpl);
        this.playersBar.appendChild(this.currentGame.htmlElements.playersBar);
        // ^The order of insertion does not matter (it used to).

        this.btn.pause.onclick = this._requestStatusBecomePlaying.bind(this);
        this.btn.pause.disabled = false;
        if (this.wantsAutoPlayPause) {
            setTimeout(() => {
                if (!document.hidden) { this._requestStatusBecomePlaying(); }
            }, 500);
            // ^This delay is for "aesthetic" purposes (not functional).
        }
    }

    /**
     * @override
     */
    protected _abstractOnBeforeLeave(navDir: SkScreen.NavDir): boolean {
        if (this.askConfirmBeforeLeave && !this.top.confirm("Are you sure you would like to leave?")) {
            return false;
        }
        document.removeEventListener("visibilitychange", this.#onVisibilityChange);
        //this._gridIsecObserver.disconnect();

        // Release the game:
        // See docs in Game.ts : Pausing is done to cancel scheduled callbacks.
        this.currentGame.statusBecomeOver();
        for (const elem of Object.values(this.currentGame.htmlElements)) {
            // IMPORTANT NOTE: For some reason, clearing children from the
            // grid-impl element is necessary to allow for garbage collection
            // of DOM nodes (at least on Chrome).
            elem.textContent = "";
            elem.remove();
        }
        this.grid.base.removeEventListener("keydown", this.#gridOnKeyDown);
        this.#currentGame = undefined;
        return true;
    }


    protected get currentGame(): Game {
        return this.#currentGame!;
    }
    /**
     * This class can use a protected alias that advertises the result
     * as always being defined.
     */
    public get probeCurrentGame(): Game | undefined {
        return this.#currentGame;
    }

    protected abstract async _createNewGame(ctorArgs: Game.CtorArgs<G,Coord.System>): Promise<Game>;


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
        ev.stopPropagation();
        if (!ev.isTrusted) return true;
        const game = this.currentGame;
        if (ev.ctrlKey && ev.key === " " && !ev.repeat) {
            // If switching operator:
            //function getOperatorElem(this: void): HTMLElement {
            //    return game.currentOperator.status.immigrantInfo.playerElem;
            //};
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
        if (ev.key === " ") {
            // Disable scroll-down via spacebar:
            ev.preventDefault();
            return false;
        }
        return true;
    }

    protected _requestStatusBecomePlaying(): void {
        this._statusBecomePlaying();
    }

    protected _requestStatusBecomePaused(): void {
        this._statusBecomePaused();
    }

    protected _statusBecomePlaying(): void {
        this.currentGame.statusBecomePlaying();
        this.btn.pause.textContent = "Pause";
        this.grid.pauseOl.style.visibility = "hidden";
        this.#pauseReason = undefined;

        this.btn.pause.onclick = this._requestStatusBecomePaused.bind(this);
        this.btn.reset.disabled = true;

        this.grid.base.focus();
    }

    protected _statusBecomePaused(): void {
        this.currentGame?.statusBecomePaused(); // intentional `?` for when initializing UI.
        this.btn.pause.textContent = "Unpause";
        this.grid.pauseOl.style.visibility = "visible";
        this.#pauseReason = document.hidden ? "page-hide" : "other";

        this.btn.pause.onclick = this._requestStatusBecomePlaying.bind(this);
        this.btn.reset.disabled = false;
    }

    /**
     * A callback passed to the constructed game to call when it ends.
     */
    protected _onGameBecomeOver(): void {
        this.btn.pause.disabled = true;
        this.btn.reset.disabled = false;
    }

    /**
     * Should only be called if all the following conditions are met:
     * - The current game exists.
     * - The current game is paused or it is over.
     */
    protected _resetGame(): void {
        this.currentGame.reset();
        this.btn.pause.disabled = false;
        if (this.wantsAutoPlayPause) {
            this._requestStatusBecomePlaying();
        }
    }


    /**
     *
     */
    private _initializeControlsBar(): void {
        const controlsBar = JsUtils.mkEl("div", [
            OmHooks.General.Class.CENTER_CONTENTS,
            OmHooks.General.Class.INPUT_GROUP,
            CSS["controls-bar"],
        ]);
        controlsBar.setAttribute("role", "menu");

        function createControlButton(
            buttonText: string,
            button?: TU.Omit<HTMLButtonElement, "onclick">,
        ): HTMLButtonElement {
            button = button ?? JsUtils.mkEl("button", []);
            // Note that these below are set outside of mkEl, since they
            // must apply if a button is provided as an argument.
            button.classList.add(OmHooks.General.Class.INPUT_GROUP_ITEM);
            button.textContent = buttonText;
            button.addEventListener("pointerenter", (ev) => {
                button!.focus();
            });
            controlsBar.appendChild(button);
            return button as HTMLButtonElement;
        }
        controlsBar.addEventListener("pointerleave", (ev) => {
            this.grid.base.focus();
        });

        { const bth = createControlButton("<Back Button Text>", this.nav.prev);
        }

        // @ts-expect-error : RO=
        this.btn = Object.freeze({
            pause: createControlButton(""),
            reset: createControlButton("Reset"),
        });
        JsUtils.propNoWrite(this as _PlayScreen<SID,G>, ["btn"]);
        this.btn.reset.onclick = this._resetGame.bind(this);

        this.baseElem.appendChild(controlsBar);
    }

    private _initializePlayersBar(): void {
        const playersBar
            // @ts-expect-error : RO=
            = this.playersBar
            = JsUtils.mkEl("div", [CSS["players-bar"]]);
        JsUtils.propNoWrite(this as _PlayScreen<SID,G>, ["playersBar"]);
        this.baseElem.appendChild(playersBar);
    }
}
export namespace _PlayScreen {
    /**
     */
    export function createGridWrapper(): Readonly<{
        top: HTMLElement,
        grid: HTMLElement,
        intersectionRoot: HTMLElement,
        implHost: HTMLElement,
        pauseOl: HTMLElement,
    }> {
        const CSS_FX = OmHooks.General.Class;
        const base = JsUtils.mkEl("div", [CSS["grid-wrapper"]]);
        base.setAttribute("role", "presentation");

        const grid = JsUtils.mkEl("div", [
            //CSS_FX.CENTER_CONTENTS,
            CSS_FX.STACK_CONTENTS,
            CSS_FX.TEXT_SELECT_DISABLED,
            GRID_CSS["this"],
        ], { tabIndex: 0 });
        grid.setAttribute("role", "textbox");
        grid.setAttribute("aria-label", "Game Grid");

        // Grid Scroll Wrapper:
        const scrollOuter = JsUtils.mkEl("div", [
            //CSS_FX.FILL_PARENT,
            GRID_CSS["scroll-outer"],
        ]);
        scrollOuter.setAttribute("role", "presentation");

        const pauseOl = JsUtils.mkEl("div", [
            CSS_FX.FILL_PARENT,
            CSS_FX.CENTER_CONTENTS,
            GRID_CSS["pause-overlay"],
        ], {});
        pauseOl.appendChild(JsUtils.mkEl("div", [], {
            textContent: "(Click to Unpause)"
        }));
        scrollOuter.appendChild(pauseOl);
        // const intersectionRoot = JsUtils.mkEl("div", []);
        // intersectionRoot.setAttribute("aria-hidden", "true");
        // intersectionRoot.classList.add(
        //     CSS_FX.FILL_PARENT,
        //     GRID_CSS["intersection-root"],
        // );
        // scrollOuter.appendChild(intersectionRoot);

        grid.appendChild(scrollOuter);
        base.appendChild(grid);
        return Object.freeze(<ReturnType<typeof _PlayScreen.createGridWrapper>>{
            top: base,
            grid,
            intersectionRoot: scrollOuter,
            implHost: scrollOuter,
            pauseOl: pauseOl,
        });
    }
}
JsUtils.protoNoEnum(_PlayScreen, [
    "probeCurrentGame", // At runtime, this is identical to this.currentGame.
    "_statusBecomePlaying", "_statusBecomePaused",
]);
JsUtils.instNoEnum(_PlayScreen, [
    "createGridWrapper",
]);
Object.freeze(_PlayScreen);
Object.freeze(_PlayScreen.prototype);