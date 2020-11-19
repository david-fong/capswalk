import { JsUtils } from "defs/JsUtils";
import { OmHooks } from "defs/OmHooks";


/**
 */
export class ScreenTransition {

	/**
	 * Usage of this element is partially aesthetic, but mostly
	 * to ease work done by the rendering engine. This is the only
	 * element styled to smoothly transition colour changes.
	 */
	public readonly baseElem: HTMLElement;

	#currentRequest: Promise<void> | undefined;

	public constructor() {
		this.baseElem = document.getElementById(OmHooks.Screen.Id.SCREEN_TINT)!;
		this.#currentRequest = undefined;
		JsUtils.propNoWrite(this as ScreenTransition, ["baseElem"]);
	}

	/**
	 * Queues the provided screen-transition request.
	 * @param request -
	 */
	public do(request: ScreenTransition.Request): Promise<void> {
		this.#currentRequest = (this.#currentRequest ?? Promise.resolve()).then(() => {
			return this._atomicDo(request);
		});
		return this.#currentRequest;
	}

	/**
	 */
	// TODO will it be safer to prevent keyboard events during the transition?
	// If so, make this.baseElem programmatically focusable, and toggle it to
	// be the focused element during the transition. When blurring it, the
	// browser should automatically recall the element that was focused before it.
	// (but please verify).
	private async _atomicDo(request: ScreenTransition.Request): Promise<void> {
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
		return;
	}

	/**
	 */
	private _triggerCssTransition(transitionTriggerFunc: () => void): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.baseElem.addEventListener("transitionend", () => resolve(), { once: true });
			transitionTriggerFunc();
		});
	}
}
export namespace ScreenTransition {
	/**
	 */
	export type Request = Readonly<{
		/**
		 * This will be awaited before calling `beforeUnblur`.
		 */
		beforeUnblurAwait?: Promise<any>,
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
JsUtils.protoNoEnum(ScreenTransition, ["_atomicDo", "_triggerCssTransition"]);
Object.freeze(ScreenTransition);
Object.freeze(ScreenTransition.prototype);