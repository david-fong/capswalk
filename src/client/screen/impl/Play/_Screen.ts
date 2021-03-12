import { Game } from "game/Game"; export { Game };

import type { OfflineGame } from "client/game/OfflineGame";
import type { OnlineGame } from "client/game/OnlineGame";
type BrowserGame = OfflineGame | OnlineGame;

import { JsUtils, BaseScreen } from "../../BaseScreen";
import { _PlayScreenInitEl } from "./ScreenInit";

/**
 * If and only if this screen is the current screen, then its
 * `currentGame` property is defined, although it is not recommended
 * to manage its state except through this class' wrapper methods,
 * which are bound to buttons and maintain other invariants between
 * the game's state and the UI's state.
 */
// TODO.impl Allow users to change the spotlight radius and grid zoom via slider.
export abstract class _PlayScreen<
	SID extends BaseScreen.Id.PLAY_OFFLINE | BaseScreen.Id.PLAY_ONLINE,
> extends _PlayScreenInitEl<SID> {

	/**
	 * This field is defined when this is the current screen, and next
	 * to all code here will only run when this screen is the current
	 * screen, but I have annotated the type as possibly undefined just
	 * so there's no question that it can, under certain conditions be
	 * undefined.
	 */
	#currentGame: undefined | BrowserGame;

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


	/** @override */
	protected _abstractLazyLoad(): void {
		super._abstractLazyLoad();

		// @ts-expect-error : RO=
		this.#onVisibilityChange = () => {
			if (!this.wantsAutoPlayPause) return;
			if (document.hidden) {
				if (this.#pauseReason === undefined) {
					const game = this.currentGame;
					if (game === undefined || (game !== undefined && game.status !== Game.Status.OVER)) {
						this._reqStatusPaused();
					}
				}
			} else {
				if (this.#pauseReason === "page-hide") { this._reqStatusPlaying(); }
			}
		};
		// @ts-expect-error : RO=
		this.#gridOnKeyDown = this._gridKeyDownCallback.bind(this);
	}

	/** @override */
	protected async _abstractOnBeforeEnter(
		navDir: BaseScreen.NavDir,
		args: BaseScreen.EntranceArgs[SID],
	): Promise<void> {
		document.addEventListener("visibilitychange", this.#onVisibilityChange);
		this.btn.pause.disabled = true;
		this._statusBecomePaused(); // <-- Leverage some state initialization.

		const game = this.#currentGame = await this._createNewGame(args);
		await game.reset();
		// ^Wait until resetting has finished before attaching the
		// grid element to the screen so that the DOM changes made
		// by populating tiles with CSP's will be batched.
		this.grid.implHost.appendChild(game.grid.baseElem);
		// this.playersBar.appendChild(game); // TODO.design
		// ^The order of insertion does not matter (it used to).

		this.btn.pause.onclick = this._reqStatusPlaying.bind(this);
		this.btn.pause.disabled = false;
		if (this.wantsAutoPlayPause) {
			setTimeout(() => {
				if (!document.hidden) { this._reqStatusPlaying(); }
			}, 100);
			// ^This delay is for "aesthetic" purposes (not functional).
		}
		this.grid.base.addEventListener("keydown", this.#gridOnKeyDown, {
			// the handler will call stopPropagation. As a result,
			// nothing inside this element can ever receive keyboard events.
			capture: true,
		});
	}

	/** @override */
	protected _abstractOnBeforeLeave(navDir: BaseScreen.NavDir): boolean {
		if (this.askConfirmBeforeLeave && !this.top.confirm("Are you sure you would like to leave?")) {
			return false;
		}
		document.removeEventListener("visibilitychange", this.#onVisibilityChange);
		//this._gridIsecObserver.disconnect();

		// Release the game:
		// See docs in Game.ts : Pausing is done to cancel scheduled callbacks.
		this.currentGame.statusBecomeOver();
		for (const elem of [this.currentGame.grid.baseElem]) {
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


	protected get currentGame(): BrowserGame {
		return this.#currentGame!;
	}
	/**
	 * This class can use a protected alias that advertises the result
	 * as always being defined.
	 */
	public get probeCurrentGame(): BrowserGame | undefined {
		return this.#currentGame;
	}

	protected abstract _createNewGame(
		[gameCtorArgs, operatorIds]: BaseScreen.EntranceArgs[SID],
	): Promise<BrowserGame>;


	/**
	 * Do not use this directly. See `this.#gridOnKeyDown`.
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

	/** @virtual */
	protected _reqStatusPlaying(): void {
		this._statusBecomePlaying();
	}

	/** @virtual */
	protected _reqStatusPaused(): void {
		this._statusBecomePaused();
	}

	/** @final */
	protected _statusBecomePlaying(): void {
		this.currentGame.statusBecomePlaying();
		this.btn.pause.textContent = "Pause";
		this.grid.pauseOl.style.visibility = "hidden";
		this.#pauseReason = undefined;

		this.btn.pause.onclick = this._reqStatusPaused.bind(this);
		this.btn.reset.disabled = true;

		this.grid.base.focus();
	}

	/** @final */
	protected _statusBecomePaused(): void {
		this.currentGame?.statusBecomePaused(); // intentional `?` for when initializing UI.
		this.btn.pause.textContent = "Unpause";
		this.grid.pauseOl.style.visibility = "visible";
		this.#pauseReason = document.hidden ? "page-hide" : "other";

		this.btn.pause.onclick = this._reqStatusPlaying.bind(this);
		this.btn.reset.disabled = false;
	}

	/**
	 * A callback passed to the constructed game to call when it ends.
	 */
	protected _onGameBecomeOver(): void {
		this.btn.pause.disabled = true;
		this.btn.reset.disabled = false;
	}
}
export namespace _PlayScreen {
}
JsUtils.protoNoEnum(_PlayScreen,
	"probeCurrentGame", // At runtime, this is identical to this.currentGame.
	"_statusBecomePlaying", "_statusBecomePaused",
);
Object.freeze(_PlayScreen);
Object.freeze(_PlayScreen.prototype);