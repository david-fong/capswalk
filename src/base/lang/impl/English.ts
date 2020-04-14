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

        private static SINGLETON?: Lowercase = undefined;

        public static getName(): Lang.Names.Value {
            return Lang.Names.ENGLISH__LOWERCASE;
        }

        public static getBlurb(): string {
            return ""; // TODO.doc
        }

        public static getInstance(): Lowercase {
            if (!this.SINGLETON) {
                this.SINGLETON  = new Lowercase();
            }
            return this.SINGLETON;
        }

        // TODO.learn see https://wikipedia.org/wiki/Keyboard_layout#Dvorak
        // and https://wikipedia.org/wiki/Keyboard_layout#Colemak

        private constructor() { super(
            Lowercase,
            Object.entries(LETTER_FREQUENCY).reduce<Lang.CharSeqPair.WeightedForwardMap>(
                (accumulator, current) => {
                    const char: Lang.Char = current[0];
                    const seq:  Lang.Seq  = current[0];
                    const weight: number  = current[1];
                    accumulator[char] = { seq, weight, };
                    return accumulator;
                },
                {},
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

        private static SINGLETON?: MixedCase = undefined;

        public static getName(): Lang.Names.Value {
            return Lang.Names.ENGLISH__MIXEDCASE;
        }

        public static getBlurb(): string {
            return ""; // TODO.doc
        }

        public static getInstance(): MixedCase {
            if (!this.SINGLETON) {
                this.SINGLETON  = new MixedCase();
            }
            return this.SINGLETON;
        }

        private constructor() {
            let initializer: Lang.CharSeqPair.WeightedForwardMap = {};
            const addMappings = (charSeqTransform: (charOrSeq: string) => string): void => {
                initializer = Object.entries(LETTER_FREQUENCY).reduce(
                    (accumulator, current) => {
                        const char: Lang.Char = charSeqTransform(current[0]);
                        const seq:  Lang.Seq  = charSeqTransform(current[0]);
                        const weight: number  = current[1];
                        accumulator[char] = { seq, weight, };
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
