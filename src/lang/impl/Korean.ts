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



    const UNICODE_HANGUL_SYLLABLES_BASE = 0xAC00;

    type JamoDesc = Readonly<{
        value: string; // not used. for readability.
        atoms: string; // used for keyboard mapping.
        roman: string;
    }>;

    type Syllable = Readonly<{
        initial: JamoDesc;
        medial:  JamoDesc;
        final:   JamoDesc;
    }>;

    /**
     * # Initial Jamo (Choseong)
     */
    const INITIALS = Object.freeze(<const>[
        { value: "ㄱ", atoms: "ㄱ",   roman: "", },
        { value: "ㄲ", atoms: "ㄱㄱ", roman: "", },
        { value: "ㄴ", atoms: "ㄴ",   roman: "", },
        { value: "ㄷ", atoms: "ㄷ",   roman: "", },
        { value: "ㄸ", atoms: "ㄷㄷ", roman: "", },
        { value: "ㄹ", atoms: "ㄹ",   roman: "", },
        { value: "ㅁ", atoms: "ㅁ",   roman: "", },
        { value: "ㅂ", atoms: "ㅂ",   roman: "", },
        { value: "ㅃ", atoms: "ㅂㅂ", roman: "", },
        { value: "ㅅ", atoms: "ㅅ",   roman: "", },
        { value: "ㅆ", atoms: "ㅅㅅ", roman: "", },
        { value: "ㅇ", atoms: "ㅇ",   roman: "", },
        { value: "ㅈ", atoms: "ㅈ",   roman: "", },
        { value: "ㅉ", atoms: "ㅈㅈ", roman: "", },
        { value: "ㅊ", atoms: "ㅊ",   roman: "", },
        { value: "ㅋ", atoms: "ㅋ",   roman: "", },
        { value: "ㅌ", atoms: "ㅌ",   roman: "", },
        { value: "ㅍ", atoms: "ㅍ",   roman: "", },
        { value: "ㅎ", atoms: "ㅎ",   roman: "", },
    ]);
    INITIALS as ReadonlyArray<JamoDesc>; // type-check

    /**
     * # Medial Jamo (Jungseong)
     */
    const MEDIALS = Object.freeze(<const>[
        { value: "ㅏ", atoms: "ㅏ",   roman: "", },
        { value: "ㅐ", atoms: "ㅐ",   roman: "", },
        { value: "ㅑ", atoms: "ㅑ",   roman: "", },
        { value: "ㅒ", atoms: "ㅒ",   roman: "", },
        { value: "ㅓ", atoms: "ㅓ",   roman: "", },
        { value: "ㅔ", atoms: "ㅔ",   roman: "", },
        { value: "ㅕ", atoms: "ㅕ",   roman: "", },
        { value: "ㅖ", atoms: "ㅖ",   roman: "", },
        { value: "ㅗ", atoms: "ㅗ",   roman: "", },
        { value: "ㅘ", atoms: "ㅗㅏ", roman: "", },
        { value: "ㅙ", atoms: "ㅗㅐ", roman: "", },
        { value: "ㅚ", atoms: "ㅗㅣ", roman: "", },
        { value: "ㅛ", atoms: "ㅛ",   roman: "", },
        { value: "ㅜ", atoms: "ㅜ",   roman: "", },
        { value: "ㅝ", atoms: "ㅜㅓ", roman: "", },
        { value: "ㅞ", atoms: "ㅜㅔ", roman: "", },
        { value: "ㅟ", atoms: "ㅜㅣ", roman: "", },
        { value: "ㅠ", atoms: "ㅠ",   roman: "", },
        { value: "ㅡ", atoms: "ㅡ",   roman: "", },
        { value: "ㅢ", atoms: "ㅡㅣ", roman: "", },
        { value: "ㅣ", atoms: "ㅣ",   roman: "", },
    ]);
    MEDIALS as ReadonlyArray<JamoDesc>; // type-check

    /**
     * # Final Jamo (Jongseong)
     */
    const FINALS = Object.freeze(<const>[
        { value: "",   atoms: "",     roman: "", },
        { value: "ㄱ", atoms: "ㄱ",   roman: "", },
        { value: "ㄲ", atoms: "ㄱㄱ", roman: "", },
        { value: "ㄳ", atoms: "ㄱㅅ", roman: "", },
        { value: "ㄴ", atoms: "ㄴ",   roman: "", },
        { value: "ㄵ", atoms: "ㄴㅈ", roman: "", },
        { value: "ㄶ", atoms: "ㄴㅎ", roman: "", },
        { value: "ㄷ", atoms: "ㄷ",   roman: "", },
        { value: "ㄹ", atoms: "ㄹ",   roman: "", },
        { value: "ㄺ", atoms: "ㄹㄱ", roman: "", },
        { value: "ㄻ", atoms: "ㄹㅁ", roman: "", },
        { value: "ㄼ", atoms: "ㄹㅂ", roman: "", },
        { value: "ㄽ", atoms: "ㄹㅅ", roman: "", },
        { value: "ㄾ", atoms: "ㄹㅌ", roman: "", },
        { value: "ㄿ", atoms: "ㄹㅍ", roman: "", },
        { value: "ㅀ", atoms: "ㄹㅎ", roman: "", },
        { value: "ㅁ", atoms: "ㅁ",   roman: "", },
        { value: "ㅂ", atoms: "ㅂ",   roman: "", },
        { value: "ㅄ", atoms: "ㅂㅅ", roman: "", },
        { value: "ㅅ", atoms: "ㅅ",   roman: "", },
        { value: "ㅆ", atoms: "ㅅㅅ", roman: "", },
        { value: "ㅇ", atoms: "ㅇ",   roman: "", },
        { value: "ㅈ", atoms: "ㅈ",   roman: "", },
        { value: "ㅊ", atoms: "ㅊ",   roman: "", },
        { value: "ㅋ", atoms: "ㅋ",   roman: "", },
        { value: "ㅌ", atoms: "ㅌ",   roman: "", },
        { value: "ㅍ", atoms: "ㅍ",   roman: "", },
        { value: "ㅎ", atoms: "ㅎ",   roman: "", },
    ]);
    FINALS as ReadonlyArray<JamoDesc>; // type-check

    /**
     * 
     */
    const WEIGHTS = {};

}
