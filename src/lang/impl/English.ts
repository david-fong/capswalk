import { Lang } from "src/lang/Lang";


/**
 * # English (QWERTY)
 * 
 * https://en.wikipedia.org/wiki/Keyboard_layout#QWERTY
 */
export class English extends Lang {

    private static SINGLETON?: English = undefined;

    public static getName(): string {
        return "English (QWERTY)";
    }

    public static getBlurb(): string {
        return ""; // TODO
    }

    public static getInstance(): English {
        if (!(English.SINGLETON)) {
            English.SINGLETON  = new English();
            delete English.INITIALIZER;
        }
        return English.SINGLETON;
    }

    // TODO: see https://en.wikipedia.org/wiki/Keyboard_layout#Dvorak
    // and https://en.wikipedia.org/wiki/Keyboard_layout#Colemak
    /**
     * Change uppercase input to lowercase for convenience.
     * 
     * @override
     */
    public remapKey(input: string): string {
        return input.toLowerCase();
    }

    /**
     * Values obtained from https://wikipedia.org/wiki/Letter_frequency
     */
    private static INITIALIZER = Object.freeze(<const>{
        a: 8.167, b: 1.492, c: 2.202, d: 4.253,
        e:12.702, f: 2.228, g: 2.015, h: 6.094,
        i: 6.966, j: 0.153, k: 1.292, l: 4.025,
        m: 2.406, n: 6.749, o: 7.507, p: 1.929,
        q: 0.095, r: 5.987, s: 6.327, t: 9.356,
        u: 2.758, v: 0.978, w: 2.560, x: 0.150,
        y: 1.994, z: 0.077,
    });

    private constructor() {
        super(
            English.getName(),
            Object.entries(English.INITIALIZER).reduce<Lang.CharSeqPair.WeightedForwardMap>(
                (accumulator, current) => {
                    const char: Lang.Char = current[0];
                    const seq:  Lang.Seq  = current[0];
                    const weight: number  = current[1];
                    accumulator[char] = { seq, weight, };
                    return accumulator;
                },
                {},
            ),
        );
    }

}
English as Lang.Info;
