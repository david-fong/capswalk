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
            "": { seq: "", weight: 0, }, // TODO
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