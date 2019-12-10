import { Lang } from "src/lang/Lang";


/**
 * https://en.wikipedia.org/wiki/Hangul_consonant_and_vowel_tables#Hangul_syllables
 * https://en.wikipedia.org/wiki/Korean_language_and_computers#Hangul_in_Unicode
 * https://en.wikipedia.org/wiki/Hangul_Jamo_(Unicode_block)
 */
export namespace Korean {

    /**
     * 
     * https://en.wikipedia.org/wiki/Revised_Romanization_of_Korean#Transcription_rules
     * https://en.wikipedia.org/wiki/Romanization_of_Korean#Systems
     */
    export class Romanization extends Lang {

        private static SINGLETON?: Romanization = undefined;

        public static getInstance(): Romanization {
            if (!(Romanization.SINGLETON)) {
                Romanization.SINGLETON = new Romanization();
                delete Romanization.INITIALIZER;
            }
            return Romanization.SINGLETON;
        }

        /**
         * Change uppercase input to lowercase for convenience.
         * 
         * @override
         */
        public remapKey(input: string): string {
            return input;
        }

        private constructor() {
            super(
                "Korean Romanization",
                Romanization.INITIALIZER,
            );
        }
    }



    /**
     * # Dubeolsik (3-row layout)
     * 
     * https://www.branah.com/korean
     */
    export class Dubeolsik extends Lang {

        private static SINGLETON?: Dubeolsik = undefined;

        public static getInstance(): Dubeolsik {
            if (!(Dubeolsik.SINGLETON)) {
                Dubeolsik.SINGLETON = new Dubeolsik();
                delete Dubeolsik.INITIALIZER;
            }
            return Dubeolsik.SINGLETON;
        }

        /**
         * Change uppercase input to lowercase for convenience.
         * 
         * @override
         */
        public remapKey(input: string): string {
            return input;
        }

        private constructor() {
            super(
                "Korean Dubeolsik",
                Dubeolsik.INITIALIZER,
            );
        }
    }



    /**
     * # Sebeolsik (5-row layout)
     * 
     * https://www.branah.com/sebeolsik
     */
    export class Sebeolsik extends Lang {

        private static SINGLETON?: Sebeolsik = undefined;

        public static getInstance(): Sebeolsik {
            if (!(Sebeolsik.SINGLETON)) {
                Sebeolsik.SINGLETON = new Sebeolsik();
                delete Sebeolsik.INITIALIZER;
            }
            return Sebeolsik.SINGLETON;
        }

        /**
         * Change uppercase input to lowercase for convenience.
         * 
         * @override
         */
        public remapKey(input: string): string {
            return input;
        }

        private constructor() {
            super(
                "Korean Sebeolsik",
                Sebeolsik.INITIALIZER,
            );
        }
    }



    type LetterDesc = Readonly<{}>;

    /**
     * Choseong
     */
    const INITIALS = Object.freeze(<const>[
        {},
    ]);
    INITIALS as ReadonlyArray<LetterDesc>; // type-check

    /**
     * Jungseong
     */
    const MEDIALS = Object.freeze(<const>[
        {},
    ]);
    MEDIALS as ReadonlyArray<LetterDesc>; // type-check

    /**
     * Jongseong
     */
    const FINALS = Object.freeze(<const>[
        {},
    ]);
    FINALS as ReadonlyArray<LetterDesc>; // type-check

    /**
     * 
     */
    const WEIGHTS = {};

}
