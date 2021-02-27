
const NO_ENUM  = Object.freeze(<const>{ enumerable: false });
const NO_WRITE = Object.freeze(<const>{ writable: false });

export namespace JsUtils {

	/** @requires obj must not contain cycles (circular references). */
	export function deepFreeze<T>(obj: T): TU.DeepRo<T> {
		_deepFreeze(obj);
		return obj as TU.DeepRo<T>;
	}
	function _deepFreeze(obj: any): void {
		for (const key of Object.getOwnPropertyNames(obj)) {
			const val = obj[key];
			if (val !== null && typeof val === "object") {
				_deepFreeze(val);
			}
		}
		Object.freeze(obj);
	}

	/** */
	export function hasProp<T, K extends keyof T>(obj: T, key: K): boolean {
		return Object.prototype.hasOwnProperty.call(obj, key);
	}

	/** */
	export function protoNoEnum<T>(
		ctor: {new(...args: any[]): T} | Function, // <- allow abstract classes
		...propNames: TU.RoArr<keyof T & string> | TU.RoArr<string>
	): void {
		const hasProps = Object.getOwnPropertyNames(ctor.prototype).freeze();
		propNames.forEach((propName) => {
			if (DEF.DevAssert) {
				if (!hasProps.includes(propName as string)) {
					const msg = `\`${ctor.name}\` prototype has no property named \"${propName}\"`;
					throw new TypeError(msg); // Mismatched property name.
				}
			}
			Object.defineProperty(ctor.prototype, propName, NO_ENUM);
		});
	}

	export const instNoEnum  = _configProp.bind(null, NO_ENUM) as _configProp;
	export const propNoWrite = _configProp.bind(null, NO_WRITE) as _configProp;

	type _configProp = <T>(inst: T, ...propNames: TU.RoArr<keyof T & string> | TU.RoArr<string>) => void;
	function _configProp<T>(
		descriptor: PropertyDescriptor,
		inst: T, ...propNames: TU.RoArr<string>
	): void {
		for (const propName of propNames) {
			if (DEF.DevAssert) {
				const hasProps = Object.getOwnPropertyNames(inst).freeze();
				if (!hasProps.includes(propName as string)) {
					const msg = `\`${(inst as any).__proto__.constructor.name}\``
					+ ` instance has no property named \"${propName}\"`;
					throw new TypeError(msg); // Mismatched property name.
				}
			}
			Object.defineProperty(inst, propName, descriptor);
		}
	}

	export type CamelCaseNameTransforms = Readonly<{
		spaceyLowercase: string;
		spaceyUppercase: string;
		spaceyCapitalized: string;
	}>;
	/**
	 * Nothing ultra fancy. Does not handle Acronyms.
	 */
	export function camelCaseTransforms(camelCaseName: string): CamelCaseNameTransforms {
		const spaceyLowercase = camelCaseName.replace(/[A-Z]/g, (letter) => " " + letter.toLowerCase());
		return Object.freeze(<CamelCaseNameTransforms>{
			spaceyLowercase,
			spaceyUppercase: spaceyLowercase.toUpperCase(),
			spaceyCapitalized: spaceyLowercase.split(' ').map((word) =>
				word.charAt(0).toUpperCase() + word.substring(1)
			).join(' '),
		});
	}

	export namespace Web {

		/** A non-user-facing markup utility. */
		export function prependComment(node: HTMLElement, commentStr: string): void {
			node.parentNode!.insertBefore(document.createComment(" " + commentStr + " "), node);
		}

		/**
		 * This is dependant on the HtmlWebpackPlugin config.
		 */
		export function adoptStyleSheet(root: Document | ShadowRoot, href: string): void {
			// if ("adoptedStyleSheets" in root) {
			// 	const sheet = Array.from(document.styleSheets).find((sheet) => sheet.href?.endsWith(href));
			// 	if (sheet !== undefined) {
			// 		// TODO.build remove this any-casting when adoptedStyleSheets
			// 		// stops being experimental and makes it into the DOM spec.
			// 		(root as any).adoptedStyleSheets = [sheet];
			// 		return;
			// 	}
			// }
			// The client's browser does not support adoptedStyleSheets :(
			root.appendChild(JsUtils.html("link", [], {
				rel: "stylesheet",
				href: href,
			}));
		}

		/**
		 * @param localPrefix
		 * Prefixes the storage keys on non-production builds. This is
		 * to prevent key collisions on null origins such as `file://`.
		 */
		export function _makeSmartStorage<
			T extends {[key : string]: string | number},
		>(
			localPrefix: string,
			storage: Storage,
			example: T,
		): Partial<T> {
			const smart: T = {} as T;
			(Object.keys(example)).forEach((key) => {
				const internalKey = (DEF.PRODUCTION ? "" : localPrefix + ".") + key;
				// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
				Object.defineProperty(smart, key, {
					enumerable: true,
					get: () => {
						const val = storage.getItem(internalKey);
						return (val === null) ? undefined : JSON.parse(val);
					},
					set: (val: boolean): void => {
						storage.setItem(internalKey, JSON.stringify(val));
					},
				});
			});
			// Sealing the object causes an error. Not sure why.
			return smart;
		}
	}

	/**
	 * A combiner for common operations surrounding `document.createElement`
	 * with some custom HTML attribute defaults.
	 *
	 * - Calls `Object.seal` immediately on the created HTMLElement.
	 * - If making a button, defaults the `type` to `button` instead of `submit`.
	 * - If making an anchor, defaults the rel to `noopener`.
	 */
	export function html<K extends keyof HTMLElementTagNameMap>(
		tagName: K,
		classNames?: string[],
		domProps?: Readonly<Partial<HTMLElementTagNameMap[K]>>,
	): HTMLElementTagNameMap[K] {
		const el = document.createElement(tagName);
		try { Object.seal(el); } catch (e) {};
		if (classNames?.length) {
			el.classList.add(...classNames);
		}

		if (tagName === "button") {
			(el as HTMLButtonElement).type = "button"; // instead of "submit".
		} else if (tagName === "a") {
			(el as HTMLAnchorElement).rel = "noopener";
			// ^ Should already be the default on modern browsers when
			// `target === "_blank"`, but it doesn't hurt to set it
			// anyway. We're going stricter too.
		}

		if (domProps !== undefined) {
			Object.assign(el, domProps);
		}
		return el;
	}

	/** */
	export function svg<K extends keyof SVGElementTagNameMap>(
		tagName: K,
		classNames?: string[],
		domProps?: Readonly<Partial<SVGElementTagNameMap[K]>>,
	): SVGElementTagNameMap[K] {
		const el = document.createElementNS("http://www.w3.org/2000/svg", tagName);
		Object.seal(el);
		if (classNames?.length) {
			el.classList.add(...classNames);
		}
		if (domProps !== undefined) {
			Object.assign(el, domProps);
		}
		return el;
	}
}
Object.freeze(JsUtils);