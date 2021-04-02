import { Game } from "game/Game"; export { Game };
import { SCROLL_INTO_CENTER } from "defs/TypeDefs";

import { JsUtils, OmHooks, BaseScreen } from "../../BaseScreen";
import style from "./style.m.css";
import grid_style from "./grid.m.css";
import type { OfflineGame } from "client/game/OfflineGame";
import type { OnlineGame } from "client/game/OnlineGame";
type BrowserGame = OfflineGame | OnlineGame;

/** */
export abstract class _PlayScreenInitEl<
	SID extends BaseScreen.Id.PLAY_OFFLINE | BaseScreen.Id.PLAY_ONLINE,
> extends BaseScreen<SID> {

	/**
	 * Hosts the scroll-wrapper and game-status overlays.
	 */
	protected readonly grid: Readonly<{
		base: HTMLElement;
		implHost: HTMLElement;
		pauseOl: HTMLElement;
		//isecObserver: IntersectionObserver;
	}>;

	protected readonly playersBar = JsUtils.html("div", [style["players-bar"]]);

	protected readonly btn: Readonly<{
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

	protected abstract readonly wantsAutoPlayPause: boolean;

	protected abstract readonly askConfirmBeforeLeave: boolean;


	/** @override */
	protected _abstractLazyLoad(): void {
		this.baseElem.classList.add(
			OmHooks.General.Class.CENTER_CONTENTS,
			style["this"],
		);

		const _gridHtml = _PlayScreenInitEl.createGridWrapper();
		// @ts-expect-error : RO=
		this.grid = Object.freeze({
			base: _gridHtml.top,
			implHost: _gridHtml.implHost,
			pauseOl: _gridHtml.pauseOl,
		});
		JsUtils.propNoWrite(this as _PlayScreenInitEl<SID>, "grid", "playersBar");
		JsUtils.Web.prependComment(this.grid.implHost, "grid impl host");
		this.grid.implHost.appendChild(document.createComment("grid impl"));

		this.baseElem.appendChild(_gridHtml.top);
		_gridHtml.pauseOl.addEventListener("click", (ev) => {
			const game = this.currentGame;
			if (game !== undefined && game.status === Game.Status.PAUSED) {
				this.grid.base.focus();
				this._reqStatusPlaying();
			}
		});
		// ^Purposely make the grid the first child so it gets tabbed to first.

		// See below link for an illustrative guide on the intersection observer API:
		// https://blog.arnellebalane.com/the-intersection-observer-api-d441be0b088d
		// Unfortunately, it seems like intersection observer is not able to do what
		// I want. It will no trigger when the target's position changes.
		/* // @ts-expect-error Assignment to readonly property: `_gridIsecObserver`:
		this.grid.isecObserver = new IntersectionObserver((entries, observer) => {
		    entries.forEach((value) => {
		        console.log(value.intersectionRatio);
		        if (!value.isIntersecting) {
		            value.target.scrollIntoView(SCROLL_INTO_CENTER);
		        }
		    });
		}, {
		    root: _gridHtml.intersectionRoot,
		    rootMargin: "-20%",
		}); */

		this._initializeControlsBar();
		this._initializePlayersBar();
	}


	protected abstract get currentGame(): BrowserGame;

	protected abstract _reqStatusPlaying(): void;
	protected abstract _reqStatusPaused(): void;

	/**
	 * Should only be called if all the following conditions are met:
	 * - The current game exists.
	 * - The current game is paused or it is over.
	 */
	protected _resetGame(): void {
		this.currentGame.reset();
		this.btn.pause.disabled = false;
		if (this.wantsAutoPlayPause) {
			this._reqStatusPlaying();
		}
	}

	/** */
	private _initializeControlsBar(): void {
		const controlsBar = JsUtils.html("div", [
			OmHooks.General.Class.CENTER_CONTENTS,
			OmHooks.General.Class.INPUT_GROUP,
			style["controls-bar"],
		]);
		controlsBar.setAttribute("role", "menu");

		function createControlButton(
			buttonText: string,
			button?: TU.Omit<HTMLButtonElement, "onclick">,
		): HTMLButtonElement {
			button = button ?? JsUtils.html("button");
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
		createControlButton("<Back Button Text>", this.nav.prev);

		// @ts-expect-error : RO=
		this.btn = Object.freeze({
			pause: createControlButton(""),
			reset: createControlButton("Reset"),
		});
		JsUtils.propNoWrite(this as _PlayScreenInitEl<SID>, "btn");
		this.btn.reset.onclick = this._resetGame.bind(this);

		this.baseElem.appendChild(controlsBar);
	}

	/** */
	private _initializePlayersBar(): void {
		JsUtils.propNoWrite(this as _PlayScreenInitEl<SID>);
		this.baseElem.appendChild(this.playersBar);
	}
}
export namespace _PlayScreenInitEl {
	/** */
	export function createGridWrapper(): Readonly<{
		top: HTMLElement,
		grid: HTMLElement,
		intersectionRoot: HTMLElement,
		implHost: HTMLElement,
		pauseOl: HTMLElement,
	}> {
		const CSS_FX = OmHooks.General.Class;
		const base = JsUtils.html("div", [style["grid-wrapper"]]);
		base.setAttribute("role", "presentation");

		const grid = JsUtils.html("div", [grid_style["this"]], { tabIndex: 0 });
		grid.setAttribute("role", "textbox");
		grid.setAttribute("aria-label", "Game Grid");

		// Grid Scroll Wrapper:
		const scrollOuter = JsUtils.html("div", [
			//CSS_FX.FILL_PARENT,
			grid_style["scroll-outer"],
		]);
		scrollOuter.setAttribute("role", "presentation");

		const pauseOl = JsUtils.html("div", [
			CSS_FX.FILL_PARENT,
			CSS_FX.CENTER_CONTENTS,
			grid_style["pause-overlay"],
		], {});
		pauseOl.appendChild(JsUtils.html("div", [], {
			textContent: "(Click to Unpause)"
		}));
		scrollOuter.appendChild(pauseOl);
		// const intersectionRoot = JsUtils.mkEl("div", []);
		// intersectionRoot.setAttribute("aria-hidden", "true");
		// intersectionRoot.classList.add(
		//     CSS_FX.FILL_PARENT,
		//     GRID_style["intersection-root"],
		// );
		// scrollOuter.appendChild(intersectionRoot);

		grid.appendChild(scrollOuter);
		base.appendChild(grid);
		return Object.freeze(<ReturnType<typeof _PlayScreenInitEl.createGridWrapper>>{
			top: base,
			grid,
			intersectionRoot: scrollOuter,
			implHost: scrollOuter,
			pauseOl: pauseOl,
		});
	}
}
JsUtils.instNoEnum(_PlayScreenInitEl, "createGridWrapper");
Object.freeze(_PlayScreenInitEl);
Object.freeze(_PlayScreenInitEl.prototype);