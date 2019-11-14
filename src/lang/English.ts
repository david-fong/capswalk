import { Lang, LangChar, LangSeq } from "src/Lang";


/**
 * 
 */
export class English extends Lang {

    private static SINGLETON: English;

    public static getInstance(): English {
        if (this.SINGLETON === undefined) {
            this.SINGLETON = new English();
        }
        return this.SINGLETON;
    }

    private constructor() {
        super(
            "English",
            Object.entries({
                // Values from https://wikipedia.org/wiki/Letter_frequency.
                a: 8.167, b: 1.492, c: 2.202, d: 4.253,
                e:12.702, f: 2.228, g: 2.015, h: 6.094,
                i: 6.966, j: 0.153, k: 1.292, l: 4.025,
                m: 2.406, n: 6.749, o: 7.507, p: 1.929,
                q: 0.095, r: 5.987, s: 6.327, t: 9.356,
                u: 2.758, v: 0.978, w: 2.560, x: 0.150,
                y: 1.994, z: 0.077,
            }).reduce<Record<LangChar, [LangSeq, number]>>(
                (accumulator, current) => {
                    accumulator[current[0]] = current;
                    return accumulator;
                },
                Object.create(null),
            ),
        );
    }

    /**
     * @override
     */
    public remapKey(input: string): string {
        return input.toLowerCase();
    }

}
