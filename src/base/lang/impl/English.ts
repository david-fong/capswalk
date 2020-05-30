import { Lang } from "lang/Lang";


/**
 *
 */
export namespace English {

    /**
     * # Lowercase (QWERTY)
     *
     * https://wikipedia.org/wiki/Keyboard_layout#QWERTY
     */
    export class Lowercase extends Lang {

        public static readonly frontend = Lang.GET_FRONTEND_DESC_BY_ID("engl-low");
        private static SINGLETON?: Lowercase = undefined;
        public static getInstance(): Lowercase {
            return this.SINGLETON ?? (this.SINGLETON = new Lowercase());
        }
        // TODO.learn see https://wikipedia.org/wiki/Keyboard_layout#Dvorak
        // and https://wikipedia.org/wiki/Keyboard_layout#Colemak
        private constructor() { super(
            Lowercase,
            Object.entries(LETTER_FREQUENCY).reduce<Lang.CharSeqPair.WeightedForwardMap>(
                (accumulator, [char,weight]) => {
                    accumulator[char] = { seq: char, weight, };
                    return accumulator;
                }, {},
            ),
        ); }
    }
    Lowercase as Lang.ClassIf;
    Object.seal(Lowercase);
    Object.freeze(Lowercase.prototype);


    /**
     * # Mixed-Case (QWERTY)
     *
     * https://wikipedia.org/wiki/Keyboard_layout#QWERTY
     */
    export class MixedCase extends Lang {

        public static readonly frontend = Lang.GET_FRONTEND_DESC_BY_ID("engl-mix");
        private static SINGLETON?: MixedCase = undefined;
        public static getInstance(): MixedCase {
            return this.SINGLETON ?? (this.SINGLETON = new MixedCase());
        }
        private constructor() {
            let initializer: Lang.CharSeqPair.WeightedForwardMap = {};
            const addMappings = (charSeqTransform: (cs: string) => string): void => {
                initializer = Object.entries(LETTER_FREQUENCY).reduce(
                    (accumulator, [_char,weight]) => {
                        const char: Lang.Char = charSeqTransform(_char);
                        accumulator[char] = { seq: char, weight, };
                        return accumulator;
                    },
                    initializer,
                );
            };
            addMappings((cs) => cs.toLowerCase());
            addMappings((cs) => cs.toUpperCase());
            super(
                MixedCase,
                initializer,
            );
        }
    }
    MixedCase as Lang.ClassIf;
    Object.seal(MixedCase);
    Object.freeze(MixedCase.prototype);


    export namespace OldCellphone {
        /**
         * You see letters and type as if on an old cellphone's numeric keypad.
         */
        export class Encode extends Lang {

            public static readonly frontend = Lang.GET_FRONTEND_DESC_BY_ID("engl-low");
            private static SINGLETON?: Encode = undefined;
            public static getInstance(): Encode {
                return this.SINGLETON ?? (this.SINGLETON = new Encode());
            }
            private constructor() { super(
                Lowercase,
                Object.entries(LETTER_FREQUENCY).reduce<Lang.CharSeqPair.WeightedForwardMap>(
                    (accumulator, [char,weight], index) => {
                        accumulator[char] = { seq: NUMPAD[index], weight, };
                        return accumulator;
                    }, {},
                ),
            ); }
        }
        Encode as Lang.ClassIf;
        Object.seal(Encode);
        Object.freeze(Encode.prototype);

        const NUMPAD = Object.freeze([3,3,3,3,3,4,3,4,]
            .flatMap((val, idx) => {
                const button = [];
                for (let str = ""; str.length < val; str += 1+idx) {
                    button.push(str);
                }
                return button;
            })
        );
    }


    /**
     * Values obtained from https://wikipedia.org/wiki/Letter_frequency
     */
    const LETTER_FREQUENCY = Object.freeze(<const>{
        a: 8.167, b: 1.492, c: 2.202, d: 4.253,
        e:12.702, f: 2.228, g: 2.015, h: 6.094,
        i: 6.966, j: 0.153, k: 1.292, l: 4.025,
        m: 2.406, n: 6.749, o: 7.507, p: 1.929,
        q: 0.095, r: 5.987, s: 6.327, t: 9.356,
        u: 2.758, v: 0.978, w: 2.560, x: 0.150,
        y: 1.994, z: 0.077,
    });

}
Object.seal(English);
