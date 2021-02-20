import { JsUtils } from "defs/JsUtils";
import { OmHooks } from "defs/OmHooks";

/**
 * @final
 */
export class ScreenTransition {

	/** */
	public readonly baseElem: HTMLElement = document.getElementById(OmHooks.Screen.Id.SCREEN_TINT)!;

	#currentRequest: Promise<void> = Promise.resolve();

	public constructor() {
		this.baseElem.tabIndex = -1;
		this.baseElem.addEventListener("keydown", (ev) => {
			ev.preventDefault();
		})
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
		this.baseElem.focus();
		const gdStyle = this.baseElem.style;
		await this._triggerCssTransition(() => {
			gdStyle.pointerEvents = "all";
			gdStyle.opacity = "1.0";
		});
		if (request.intermediateTransitionTrigger !== undefined) {
			await this._triggerCssTransition(() => {
				request.intermediateTransitionTrigger!();
			});
		}
		await request.beforeUnblurAwait;
		if (request.beforeUnblur !== undefined) {
			request.beforeUnblur();
		}
		await this._triggerCssTransition(() => {
			gdStyle.pointerEvents = "none";
			gdStyle.opacity = "0.0";
		});
		this.baseElem.blur();
		return;
	}

	/** */
	private _triggerCssTransition(transitionTriggerFunc: () => void): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.baseElem.addEventListener("transitionend", () => resolve(), { once: true });
			transitionTriggerFunc();
		});
	}
}
export namespace ScreenTransition {
	/** */
	export type Request = Readonly<{
		/**
		 * This will be awaited before calling `beforeUnblur`. Its
		 * purpose is to allow externally triggered long-running-tasks
		 * which should finished before the next screen is visible to
		 * run during the transition.
		 */
		beforeUnblurAwait?: Promise<any>,
		/**
		 * Triggers a style change that transitions between values.
		 * */
		intermediateTransitionTrigger?: () => void,
		/**
		 * This is done after `intermediateTransitionTrigger` finishes.
		 */
		// NOTE: The above order-of-operations decision was made arbitrarily,
		// as no specific ordering for those two steps was required at the
		// time of deciding it. It may be safely changed if needed.
		beforeUnblur?: () => void,
	}>;
}
JsUtils.protoNoEnum(ScreenTransition, "_atomicDo", "_triggerCssTransition");
Object.freeze(ScreenTransition);
Object.freeze(ScreenTransition.prototype);