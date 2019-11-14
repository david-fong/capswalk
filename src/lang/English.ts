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
            [..."abcdefghijklmnopqrstuvwxyz",].reduce<Record<LangChar, LangSeq>>(
                (accumulator, current) => {
                    accumulator[current] = current;
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
