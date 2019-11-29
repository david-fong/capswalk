import { Lang } from "src/lang/Lang";
import { WeightedCspForwardMap } from "src/lang/LangSeqTreeNode";


/**
 * 
 */
export class English extends Lang {

    private static SINGLETON: English = undefined;

    public static getInstance(): English {
        if (!(English.SINGLETON)) {
            English.SINGLETON  = new English();
            English.INITIALIZER = null;
        }
        return English.SINGLETON;
    }

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
            "English",
            Object.entries(English.INITIALIZER).reduce<WeightedCspForwardMap>(
                (accumulator, current) => {
                    const char: Lang.Char = current[0];
                    const seq:  Lang.Seq  = current[0];
                    const weight: number  = current[1];
                    accumulator[char] = { seq, weight, };
                    return accumulator;
                },
                Object.create(null),
            ),
        );
    }

}
