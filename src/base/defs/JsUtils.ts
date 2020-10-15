

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
        propNames: TU.RoArr<keyof T & string> | TU.RoArr<string>,
        // ^This weird looking typing allows for autocomplete for
        // public prototype properties, and inclusion of non-public
        // prototype properties (without static checking existence).
    ): void {
        propNames.forEach((propName) => {
            if (!Object.getOwnPropertyNames(ctor.prototype).includes(propName as string)) {
                const msg = `\`${ctor.name}\` prototype has no property named \"${propName}\"`;
                throw new TypeError(msg); // Mismatched property name.
            }
            Object.defineProperty(ctor.prototype, propName, {
                enumerable: false,
            });
        });
    }

    /**
     */
    export function instNoEnum<T>(
        inst: T,
        propNames: TU.RoArr<keyof T & string> | TU.RoArr<string>,
    ): void {
        _configProp(inst, propNames, {enumerable: false,});
    }

    /**
     */
    export function propNoWrite<T>(
        inst: T,
        propNames: TU.RoArr<keyof T & string> | TU.RoArr<string>,
    ): void {
        _configProp(inst, propNames, {writable: false,})
    }

    function _configProp<T>(
        inst: T, propNames: TU.RoArr<string>, descriptor: PropertyDescriptor,
    ): void {
        propNames.forEach((propName) => {
            if (!Object.getOwnPropertyNames(inst).includes(propName as string)) {
                const msg = `\`${(inst as any).__proto__.constructor.name}\``
                + ` instance has no property named \"${propName}\"`;
                throw new TypeError(msg); // Mismatched property name.
            }
            Object.defineProperty(inst, propName, descriptor);
        });
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
}
Object.freeze(JsUtils);