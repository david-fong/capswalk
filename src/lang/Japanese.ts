import { Lang, LangChar, LangSeq } from "src/Lang";
import { WeightedCspForwardMap } from "src/LangSeqTreeNode";


export namespace Japanese {


    /**
     * 
     */
    export class Hiragana extends Lang {

        private static SINGLETON: Hiragana = undefined;

        public static getInstance(): Hiragana {
            if (!(Hiragana.SINGLETON)) {
                Hiragana.SINGLETON = new Hiragana();
                Hiragana.INITIALIZER = null;
            }
            return Hiragana.SINGLETON;
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
         * Values obtained from page 18 of the below pdf (p.499 of text)
         * https://link.springer.com/content/pdf/10.3758/BF03200819.pdf
         * 
         * alternate unused source:
         * https://gawron.sdsu.edu/crypto/japanese_models/hir_freq.html
         * (https://gawron.sdsu.edu/crypto/lectures/hiragana.html)
         */
        public static INITIALIZER = Object.freeze(<const>{
            "の": { seq: "no", weight: 1918313, },
            "に": { seq: "ni", weight: 1108840, },
            "た": { seq: "ta", weight: 1067566, },
            "い": { seq: "i",  weight: 1060284, },
            "は": { seq: "ha", weight:  937811, },
            "を": { seq: "wo", weight:  936356, },
            "と": { seq: "to", weight:  927938, },
            "る": { seq: "ru", weight:  916652, },
            "が": { seq: "ga", weight:  860742, },
            "し": { seq: "shi",weight:  848132, },
            "で": { seq: "de", weight:  764834, },
            "て": { seq: "te", weight:  758316, },
            "な": { seq: "na", weight:  720156, },
            "あ": { seq: "a",  weight:  537294, },
          //"っ": { seq: "-",  weight:  467350, },
            "れ": { seq: "re", weight:  450805, },
            "ら": { seq: "ra", weight:  42329, },
            "も": { seq: "mo", weight:  396142, },
            "う": { seq: "u",  weight:  352965, },
            "す": { seq: "su", weight:  340654, },
            "り": { seq: "ri", weight:  333999, },
            "こ": { seq: "ko", weight:  312227, },
            "だ": { seq: "da", weight:  280911, },
            "ま": { seq: "ma", weight:  278599, },
            "さ": { seq: "sa", weight:  258960, },
            "き": { seq: "ki", weight:  233505, },
            "め": { seq: "me", weight:  223806, },
            "く": { seq: "ku", weight:  221960, },
        });

        private constructor() {
            super(
                "Japanese Hiragana",
                Hiragana.INITIALIZER,
            );
        }
    }



    /**
     * 
     */
    export class Katakana extends Lang {

        private static SINGLETON: Katakana = undefined;

        public static getInstance(): Katakana {
            if (!(Katakana.SINGLETON)) {
                Katakana.SINGLETON = new Katakana();
                Katakana.INITIALIZER = null;
            }
            return Katakana.SINGLETON;
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
         * Values obtained from page 19 of the below pdf (p.500 of text)
         * https://link.springer.com/content/pdf/10.3758/BF03200819.pdf
         */
        public static INITIALIZER = Object.freeze(<const>{
            "": { seq: "", weight: 0, }, // TODO
        });

        private constructor() {
            super(
                "Japanese Hiragana",
                Katakana.INITIALIZER, // TODO
            );
        }
        ;
    }


}