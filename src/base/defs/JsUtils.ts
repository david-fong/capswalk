
const NO_ENUM  = Object.freeze(<const>{ enumerable: false });
const NO_WRITE = Object.freeze(<const>{ writable: false });

export namespace JsUtils {
	/**
	 * Copied from TypeScript official docs.
	 *
	 * @param derivedCtor -
	 * @param baseCtors -
	 */
	export function applyMixins(derivedCtor: any, baseCtors: any[]): void {
		baseCtors.forEach((baseCtor) => {
			Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
				Object.defineProperty(derivedCtor.prototype, name,
					Object.getOwnPropertyDescriptor(baseCtor.prototype, name)!
				);
			});
		});
	}

	/**
	 * @param obj
	 * An object with no cycles (circular references).
	 */
	export function deepFreeze<T>(obj: T): TU.DeepRo<T> {
		_deepFreeze(obj);
		return obj as TU.DeepRo<T>;
	}
	function _deepFreeze(obj: any): void {
		for (const key of Object.getOwnPropertyNames(obj)) {
			const val = obj[key];
			if (typeof val === "object") {
				deepFreeze(val);
			}
		}
		Object.freeze(obj);
	}

	/**
	 */
	export namespace Decor {
		/**
		 * Aliases to decorators that make a property non-enumerable.
		 * They do the same thing but are used for different reasons.
		 */
		export namespace NonEnumerable {
			/**
			 * Disable enumeration to make something that is less visible
			 * at compile time also less visible at runtime. Prevents clutter
			 * when tab-completing in a developer interpreter console.
			 */
			export function access(
				target: any,
				propertyKey: string,
				descriptor: PropertyDescriptor
			): void {
				descriptor.enumerable = false;
			};
			/**
			 * Disable enumeration for cyclic fields of an object that is
			 * most often accessed through a containing collection.
			 */
			export function cyclic(
				target: any,
				propertyKey: string,
				descriptor: PropertyDescriptor
			): void {
				descriptor.enumerable = false;
			};
		}
	}

	/**
	 */
	export function protoNoEnum<T>(
		ctor: {new(...args: any[]): T} | Function, // <- allow abstract classes
		...propNames: TU.RoArr<keyof T & string> | TU.RoArr<string>
		// ^This weird looking typing allows for autocomplete for
		// public prototype properties, and inclusion of non-public
		// prototype properties (without static checking existence).
	): void {
		propNames.forEach((propName) => {
			if (DEF.DevAssert) {
				if (!Object.getOwnPropertyNames(ctor.prototype).includes(propName as string)) {
					const msg = `\`${ctor.name}\` prototype has no property named \"${propName}\"`;
					throw new TypeError(msg); // Mismatched property name.
				}
			}
			Object.defineProperty(ctor.prototype, propName, NO_ENUM);
		});
	}

	/**
	 */
	export function instNoEnum<T>(
		inst: T,
		...propNames: TU.RoArr<keyof T & string> | TU.RoArr<string>
	): void {
		_configProp(inst, propNames, NO_ENUM);
	}
	/**
	 */
	export function propNoWrite<T>(
		inst: T,
		...propNames: TU.RoArr<keyof T & string> | TU.RoArr<string>
	): void {
		_configProp(inst, propNames, NO_WRITE);
	}

	function _configProp<T>(
		inst: T, propNames: TU.RoArr<string>, descriptor: PropertyDescriptor,
	): void {
		propNames.forEach((propName) => {
			if (DEF.DevAssert) {
				if (!Object.getOwnPropertyNames(inst).includes(propName as string)) {
					const msg = `\`${(inst as any).__proto__.constructor.name}\``
					+ ` instance has no property named \"${propName}\"`;
					throw new TypeError(msg); // Mismatched property name.
				}
			}
			Object.defineProperty(inst, propName, descriptor);
		});
	}

	/**
	 * A non-user-facing markup utility.
	 */
	export function prependComment(node: HTMLElement, commentStr: string): void {
		node.parentNode!.insertBefore(document.createComment(" " + commentStr + " "), node);
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

	/**
	 * A combiner for common operations surrounding `document.createElement`
	 * with some custom HTML attribute defaults.
	 *
	 * - Calls `Object.seal` immediately on the created HTMLElement.
	 * - If making a button, defaults the `type` to `button` instead of `submit`.
	 * - If making an anchor, defaults the rel to `noopener`.
	 *
	 * @param tagName -
	 * @param classNames -
	 * @param domProperties -
	 */
	export function mkEl<
		K extends keyof HTMLElementTagNameMap,
		V extends HTMLElementTagNameMap[K],
	>(
		tagName: K,
		classNames: Array<string>,
		domProperties: Readonly<Partial<V>> | undefined = undefined,
	): HTMLElementTagNameMap[K] {
		const el = document.createElement(tagName);
		try { Object.seal(el); } catch (e) {};
		if (classNames.length) {
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

		if (domProperties !== undefined) {
			Object.assign(el, domProperties);
		}
		return el;
	}
}
Object.freeze(JsUtils);