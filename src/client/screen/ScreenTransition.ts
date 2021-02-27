import { JsUtils } from "defs/JsUtils";
import { OmHooks } from "defs/OmHooks";

/**
 * @final
 */
export class ScreenTransition {

	/** */
	public readonly baseElem = document.getElementById(OmHooks.Screen.Id.SCREEN_TINT)!;

	#currentRequest = Promise.resolve();

	public constructor() {
		this.baseElem.tabIndex = -1;
		this.baseElem.addEventListener("keydown", (ev) => {
			ev.preventDefault();
			// ev.stopPropagation(); // <- not needed
		}, { capture: true });
		JsUtils.propNoWrite(this as ScreenTransition, "baseElem");
		Object.seal(this); //🧊
	}

	/**
	 * Queues the provided screen-transition request.
	 * @param request -
	 */
	public do(request: ScreenTransition.Request): Promise<void> {
		this.#currentRequest = (this.#currentRequest).then(() => {
			return this._atomicDo(request);
		});
		return this.#currentRequest;
	}

	/** */
	private async _atomicDo(request: ScreenTransition.Request): Promise<void> {
		const oldFocusEl = document.activeElement;
		this.baseElem.focus();
		const style = this.baseElem.style;

		await this._cssTransition(function blur(): void {
			style.pointerEvents = "all";
			style.opacity = "1.0";
		});

		if (request.intermediateTransitionTrigger !== undefined) {
			await this._cssTransition(() => {
				request.intermediateTransitionTrigger!();
			});
		}
		await request.whileBeforeUnblur;

		if (oldFocusEl instanceof HTMLElement) { oldFocusEl.focus(); }
		if (request.beforeUnblur !== undefined) {
			request.beforeUnblur();
		}
		await this._cssTransition(function unblur(): void {
			style.pointerEvents = "none";
			style.opacity = "0.0";
		});
		this.baseElem.blur();
		return;
	}

	/** */
	private _cssTransition(trigger: () => void): Promise<void> {
		return new Promise<void>((resolve) => {
			this.baseElem.addEventListener("transitionend", () => resolve(), { once: true });
			trigger();
		});
	}
}
export namespace ScreenTransition {
	/** */
	export type Request = Readonly<{
		/**
		 * Triggers a style change that transitions between values.
		 * */
		intermediateTransitionTrigger?: () => void,
		/**
		 * This will be awaited before calling `beforeUnblur`. Its
		 * purpose is to allow externally triggered long-running-tasks
		 * which should finished before the next screen is visible to
		 * run during the transition.
		 */
		whileBeforeUnblur?: Promise<void>,
		/**
		 * This is done after `intermediateTransitionTrigger` finishes.
		 */
		beforeUnblur?: () => void,
	}>;
}
JsUtils.protoNoEnum(ScreenTransition, "_atomicDo", "_cssTransition");
Object.freeze(ScreenTransition);
Object.freeze(ScreenTransition.prototype);