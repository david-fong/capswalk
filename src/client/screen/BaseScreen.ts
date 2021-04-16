import { JsUtils } from "defs/JsUtils";
import { OmHooks } from "defs/OmHooks";
import { StorageHooks } from "../StorageHooks";
import type { Coord } from "floor/Tile";
import type { Game } from "game/Game";
import type { AllScreens } from "./AllScreens";
import type { TopLevel } from "../TopLevel";

export { JsUtils, OmHooks, Coord, StorageHooks };

const OMHC = OmHooks.Screen.Class;

/**
 * NOTE: Design decision: Isolate from the rest of the architecture.
 * Ie. Do not give it circular / upward references to anything that
 * references it.
 */
export abstract class BaseScreen<SID extends BaseScreen.Id> {

	public readonly screenId: SID;
	public readonly screenNames: JsUtils.CamelCaseNameTransforms;

	protected readonly top: TopLevel;

	readonly #parentElem: HTMLElement;
	protected readonly baseElem = JsUtils.html("div", [OMHC.BASE]);

	#hasLazyLoaded = false;

	protected readonly nav: Readonly<{
		/**
		 * `onclick` callback is registered automatically. Do not overwrite it.
		 */
		prev: TU.Omit<HTMLButtonElement, "onclick">;
		next: HTMLButtonElement;
	}>;

	/**
	 * Implementations can use this as part of navigation button
	 * handlers. Refers directly to AllSkScreens.goToScreen.
	 */
	protected readonly requestGoToScreen: AllScreens["goToScreen"];

	/** */
	public constructor(
		ctx: BaseScreen.CtorArgs,
		screenId: SID,
	) {
		this.screenId           = screenId;
		this.screenNames        = JsUtils.camelCaseTransforms(screenId);
		this.top                = ctx.toplevel;
		this.#parentElem        = ctx.parentElem;
		this.requestGoToScreen  = ctx.goToScreen;
		this.nav = Object.freeze({
			prev: JsUtils.html("button"),
			next: JsUtils.html("button"),
		});
		JsUtils.propNoWrite(this as BaseScreen<SID>,
			"screenId", "top", "baseElem", "nav", "requestGoToScreen",
		);
		this.nav.prev.classList.add(OMHC.NAV_PREV);
		this.nav.next.classList.add(OMHC.NAV_NEXT);
		this.nav.prev.textContent = "Back";
		this.nav.next.textContent = "Next";

		// @ts-expect-error : RO=
		this.nav.prev.onclick = (ev) => {
			const tree = BaseScreen.NavTree;
			const thisNav = tree[this.screenId];
			if (tree[thisNav.prev].href === thisNav.href) {
				this.requestGoToScreen(BaseScreen.NavTree[screenId].prev, void 0);
			} else {
				window.history.back();
			}
		};
	}

	/**
	 * Implementations should set the CSS class for the base element.
	 */
	protected abstract _abstractLazyLoad(): void;

	/**
	 * @final
	 * Made public so screens can preemtively load their next screen
	 * in case that is required (such as of registering websocket
	 * listeners).
	 */
	public lazyLoad(): void {
		if (!this.#hasLazyLoaded) {
			this._abstractLazyLoad();
			this.baseElem.setAttribute("aria-label", this.screenNames.spaceyCapitalized + " Screen");
			this.#hasLazyLoaded = true;
		}
	}

	/** @final **Do not override.** */
	public async _enter(
		navDir: BaseScreen.NavDir,
		args: BaseScreen.EntranceArgs[SID],
	): Promise<void> {
		document.title = `${this.screenNames.spaceyCapitalized} | ${this.top.defaultDocTitle}`;
		if (navDir === BaseScreen.NavDir.FORWARD) {
			const location = new window.URL(window.location.href);
			const nextHistRoot = location.hash = BaseScreen.NavTree[this.screenId].href;
			const args: Parameters<typeof window.history.pushState> = [{ screenId: this.screenId }, "", location.href];
			if (window.history.state?.screenId !== nextHistRoot) {
				if (BaseScreen.NavTree[this.screenId].prev === this.screenId) {
					// If entering the root screen for the first time:
					history.replaceState(...args);
				} else {
					history.pushState(...args);
				}
			}
		}
		this.lazyLoad();
		await this._abstractOnBeforeEnter(navDir, args);
	}

	/**
	 * @final **Do not override.**
	 * @returns false if the leave was cancelled.
	 */
	public _leave(navDir: BaseScreen.NavDir): boolean {
		if (this._abstractOnBeforeLeave(navDir)) {
			return true;
		}
		return false;
	}

	/** @final **Do not override.** */
	public _onAfterEnter(): void {
		this.baseElem.setAttribute("aria-current", "true"); // exists.
		this.#parentElem.appendChild(this.baseElem);
	}
	/** @final **Do not override.** */
	public _onAfterLeave(): void {
		this.baseElem.setAttribute("aria-current", "false"); // non-existant.
		this.baseElem.remove();
	}

	/** @virtual */
	public getRecommendedFocusElem(): HTMLElement | undefined {
		return undefined;
	}

	/**
	 * @virtual
	 * This is a good place to start any `setInterval` schedules.
	 *
	 * The default implementation does nothing. Overriding implementations
	 * from direct subclasses can safely skip making a supercall.
	 *
	 * Must not call `this.requestGoToScreen`.
	 */
	protected async _abstractOnBeforeEnter(
		navDir: BaseScreen.NavDir,
		args: BaseScreen.EntranceArgs[SID],
	): Promise<void> {
	}

	/**
	 * @virtual
	 * Return false if the leave should be cancelled. This functionality
	 * allows an implementation to provide a prompt to the user such as
	 * a confirmation modal warning that unsaved changes would be lost.
	 *
	 * top any non-essential `setInterval` schedules that were set up
	 * in `_abstractOnBeforeEnter`.
	 *
	 * This method will not be called upon navigating to a different
	 * page, so actions such as writes to persisted storage should not
	 * be placed here as an optimization.
	 *
	 * @requires
	 * Must not call `this.requestGoToScreen`.
	 */
	protected _abstractOnBeforeLeave(navDir: BaseScreen.NavDir): boolean {
		return true;
	}

}
export namespace BaseScreen {

	export enum Id {
		// General:     ===================
		HOME            = "home",
		HOW_TO_PLAY     = "how-to-play",
		HOW_TO_HOST     = "how-to-host",
		SETTINGS     = "colour-control",
		// Offline:     ===================
		SETUP_OFFLINE   = "setup-offline",
		PLAY_OFFLINE    = "play-offline",
		// Online:      ===================
		GROUP_JOINER    = "group-joiner",
		SETUP_ONLINE    = "setup-online",
		GROUP_LOBBY     = "group-lobby",
		PLAY_ONLINE     = "play-online",
		// =======      ===================
	}
	Object.freeze(Id);

	/**
	 * If not a navigation leaf, must be `{}`. If history root is not
	 * self, then can be a partial object for forward navigation.
	 */
	export interface EntranceArgs {
		[ Id.HOME          ]: void;
		[ Id.HOW_TO_PLAY   ]: void;
		[ Id.HOW_TO_HOST   ]: void;
		[ Id.SETTINGS   ]: void;
		//==================
		[ Id.SETUP_OFFLINE ]: void;
		[ Id.PLAY_OFFLINE  ]: [Game.CtorArgs.UnFin];
		//==================
		[ Id.GROUP_JOINER  ]: void;
		[ Id.GROUP_LOBBY   ]: void;
		[ Id.SETUP_ONLINE  ]: void;
		[ Id.PLAY_ONLINE   ]: [Game.CtorArgs, readonly number[]];
	}
	/**
	 * Note that forward navigation has no obligation to comply with
	 * the navigation tree.
	 *
	 * Note: The fact that the lobby precedes the online setup screen
	 * for the group host is important, since the socket listener for
	 * UserInfoChange events is only registered in the lobby screen.
	 */
	export const NavTree = JsUtils.deepFreeze(<const>{
		[ Id.HOME          ]: { prev: Id.HOME,          href: Id.HOME },
		[ Id.HOW_TO_PLAY   ]: { prev: Id.HOME,          href: Id.HOW_TO_PLAY },
		[ Id.HOW_TO_HOST   ]: { prev: Id.HOME,          href: Id.HOW_TO_HOST },
		[ Id.SETTINGS      ]: { prev: Id.HOME,          href: Id.SETTINGS },
		//==========================================================================
		[ Id.SETUP_OFFLINE ]: { prev: Id.HOME,          href: Id.SETUP_OFFLINE },
		[ Id.PLAY_OFFLINE  ]: { prev: Id.SETUP_OFFLINE, href: Id.SETUP_OFFLINE },
		//==========================================================================
		[ Id.GROUP_JOINER  ]: { prev: Id.HOME,          href: Id.GROUP_JOINER },
		[ Id.GROUP_LOBBY   ]: { prev: Id.GROUP_JOINER,  href: Id.GROUP_JOINER },
		[ Id.SETUP_ONLINE  ]: { prev: Id.GROUP_LOBBY,   href: Id.GROUP_JOINER },
		[ Id.PLAY_ONLINE   ]: { prev: Id.GROUP_LOBBY,   href: Id.GROUP_JOINER },
	});
	(function _assertNavigationTreeIsValid(): void {
	if (DEF.DevAssert) Object.entries(NavTree).forEach(([id, desc]) => {
		// Enforced By: Code author's adherence to spec.
		let prev = id as Id;
		const visited = new Set<Id>();
		do {
			if (visited.has(prev)) {
				throw new Error("Navigation tree must not contain cycles.");
			}
			visited.add(prev);
			prev = NavTree[prev].prev;
			if (prev === id) {
				break;
			}
		} while (prev !== NavTree[prev].prev);
		if (prev !== Id.HOME) {
			throw new Error("The home screen must be the root of the screen-navigation tree.");
		}
	}); })();

	export const enum NavDir {
		FORWARD  = "forward",
		BACKWARD = "backward",
	}
	export function GET_NAV_DIR(_args: { curr: Id | undefined, dest: Id, }): NavDir {
		const { curr, dest } = _args;
		if (curr === undefined) return BaseScreen.NavDir.FORWARD;
		let prev = curr;
		while (prev !== BaseScreen.NavTree[prev].prev) {
			prev      = BaseScreen.NavTree[prev].prev;
			if (prev === dest) return BaseScreen.NavDir.BACKWARD;
		}
		// TODO.impl instead of the below, check that dest's prev chain contains curr.
		// If do-while completes, then dest must be in the forward direction:
		return BaseScreen.NavDir.FORWARD;
	}

	export interface CtorArgs {
		readonly toplevel: TopLevel,
		readonly parentElem: HTMLElement,
		readonly goToScreen: AllScreens["goToScreen"],
	}
}
Object.freeze(BaseScreen);
Object.freeze(BaseScreen.prototype);