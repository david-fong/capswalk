import { Lang } from "src/lang/Lang";


/**
 * https://en.wikipedia.org/wiki/Hangul_consonant_and_vowel_tables#Hangul_syllables
 * https://en.wikipedia.org/wiki/Korean_language_and_computers#Hangul_in_Unicode
 * https://en.wikipedia.org/wiki/Hangul_Jamo_(Unicode_block)
 */
export namespace Korean {

    /**
     * # Dubeolsik (3-row layout)
     * 
     * https://en.wikipedia.org/wiki/Keyboard_layout#Dubeolsik
     * https://www.branah.com/korean
     */
    export class Dubeolsik extends Lang {

        private static SINGLETON?: Dubeolsik = undefined;

        public static getInstance(): Dubeolsik {
            if (!(Dubeolsik.SINGLETON)) {
                Dubeolsik.SINGLETON = new Dubeolsik();
                delete Dubeolsik.KEYBOARD;
            }
            return Dubeolsik.SINGLETON;
        }

        /**
         * Does nothing.
         * 
         * @override
         */
        public remapKey(input: string): string {
            return input;
        }

        private static KEYBOARD = Object.freeze(<const>{
            "ㅂ": "q", "ㅈ": "w", "ㄷ": "e", "ㄱ": "r", "ㅅ": "t",
            "ㅛ": "y", "ㅕ": "u", "ㅑ": "i", "ㅐ": "o", "ㅔ": "p",
            "ㅁ": "a", "ㄴ": "s", "ㅇ": "d", "ㄹ": "f", "ㅎ": "g",
            "ㅗ": "h", "ㅓ": "j", "ㅏ": "k", "ㅣ": "l",
            "ㅋ": "z", "ㅌ": "x", "ㅊ": "c", "ㅍ": "v", "ㅠ": "b",
            "ㅜ": "n", "ㅡ": "m",
            "ㅃ": "Q", "ㅉ": "W", "ㄸ": "E", "ㄲ": "R", "ㅆ": "T",
            "ㅒ": "O", "ㅖ": "P",
        });

        private constructor() {
            super(
                "Korean Dubeolsik (한국어 키보드)",
                INITIALIZE((ij, mj, fj) => {
                    const atoms = [ij, mj, fj,].flatMap((jamos) => jamos.atoms.split(""));
                    return atoms.map((atom) => Dubeolsik.KEYBOARD[atom]).join("");
                }),
            );
        }
    }



    /**
     * # Sebeolsik (5-row layout)
     * 
     * https://en.wikipedia.org/wiki/Keyboard_layout#Sebeolsik_Final
     * https://www.branah.com/sebeolsik
     */
    export class Sebeolsik extends Lang {

        private static SINGLETON?: Sebeolsik = undefined;

        public static getInstance(): Sebeolsik {
            if (!(Sebeolsik.SINGLETON)) {
                Sebeolsik.SINGLETON = new Sebeolsik();
                delete Sebeolsik.KEYBOARD;
            }
            return Sebeolsik.SINGLETON;
        }

        /**
         * Does nothing.
         * 
         * @override
         */
        public remapKey(input: string): string {
            return input;
        }

        /**
         * This is giving me a bad time...
         * It allows for multiple ways to type something...
         * Okay scratch above. turns out each half of keyboard has intended
         * function (initial, medial, final). Need to separate KEYBOARD here
         * into three sub-maps based on which role the fragment plays.
         */
        // TODO: see above.
        private static KEYBOARD = Object.freeze(<const>{
            "ㅎ": "1", "ㅆ": "2", "ㅂ": "3", "ㅛ": "4", "ㅠ": "5",
            "ㅑ": "6", "ㅖ": "7", "ᅴ": "8", "ㅜ": "9", "ㅋ": "0",
            "ㅅ": "q", "ㄹ": "w", "ㅕ": "e", "ㅐ": "r", "ㅓ": "t",
            "ㄹ": "y", "ㄷ": "u", "ㅁ": "i", "ㅊ": "o", "ㅍ": "p",
            "ㅇ": "a",
            "ㄴ": "s",
            "": "",
            "": "",
            "": "",
            "": "",
            "": "",
            "": "",
            "": "",
            "": "",
            "": "",
            "": "",
            "": "",
            "": "",
            "": "",
        });

        private constructor() {
            super(
                "Korean Sebeolsik (세벌식 키보드)",
                Sebeolsik.INITIALIZER,
            );
        }
    }



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
            }
            return Romanization.SINGLETON;
        }

        /**
         * Does nothing.
         * 
         * @override
         */
        public remapKey(input: string): string {
            return input;
        }

        private constructor() {
            super(
                "Korean Romanization",
                INITIALIZE((ij, mj, fj) => {
                    return ij.roman + mj.roman + fj.roman;
                }),
            );
        }
    }



    const UNICODE_HANGUL_SYLLABLES_BASE = 0xAC00;

    type JamoDesc = Readonly<{
        value: string; // not used. for readability.
        atoms: string; // used for keyboard mapping.
        roman: string;
    }>;

    /**
     * Helper for each implementation's constructors.
     * 
     * @param seqBuilder - Return a {@link Lang.Seq} based on the three
     *      parts of a syllable (passed in to this as parameters).
     * @returns A transformation of initializer information to a form
     *      suitable for consumption by the {@link Lang} constructor.
     */
    const INITIALIZE = (seqBuilder: { (
        ij: typeof INITIALS[number],
        mj: typeof MEDIALS[number],
        fj: typeof FINALS[number],
    ): string, }): Lang.CharSeqPair.WeightedForwardMap => {
        const forwardDict: Lang.CharSeqPair.WeightedForwardMap = {};
        INITIALS.forEach((initialJamo, initialIdx) => {
            MEDIALS.forEach((medialJamo, medialIdx) => {
                FINALS.forEach((finalJamo, finalIdx) => {
                    let unicode = INITIALS.length * (initialIdx);
                    unicode = MEDIALS.length * (unicode + medialIdx);
                    unicode =  FINALS.length * (unicode + finalIdx);
                    const char = String.fromCharCode((UNICODE_HANGUL_SYLLABLES_BASE + unicode));
                    forwardDict[char] = {
                        seq: seqBuilder(initialJamo, medialJamo, finalJamo),
                        weight: WEIGHTS[char],
                    };
                });
            });
        });
        return forwardDict;
    }

    /**
     * # Initial Jamo (Choseong)
     */
    const INITIALS = Object.freeze(<const>[
        { value: "ㄱ", atoms: "ㄱ",   roman: "g",  },
        { value: "ㄲ", atoms: "ㄱㄱ", roman: "kk", },
        { value: "ㄴ", atoms: "ㄴ",   roman: "n",  },
        { value: "ㄷ", atoms: "ㄷ",   roman: "d",  },
        { value: "ㄸ", atoms: "ㄷㄷ", roman: "tt", },
        { value: "ㄹ", atoms: "ㄹ",   roman: "r",  },
        { value: "ㅁ", atoms: "ㅁ",   roman: "m",  },
        { value: "ㅂ", atoms: "ㅂ",   roman: "b",  },
        { value: "ㅃ", atoms: "ㅂㅂ", roman: "pp", },
        { value: "ㅅ", atoms: "ㅅ",   roman: "s",  },
        { value: "ㅆ", atoms: "ㅅㅅ", roman: "ss", },
        { value: "ㅇ", atoms: "ㅇ",   roman: "-",  }, // TODO: "-" ? see wikipedia
        { value: "ㅈ", atoms: "ㅈ",   roman: "j",  },
        { value: "ㅉ", atoms: "ㅈㅈ", roman: "jj", },
        { value: "ㅊ", atoms: "ㅊ",   roman: "ch", },
        { value: "ㅋ", atoms: "ㅋ",   roman: "k",  },
        { value: "ㅌ", atoms: "ㅌ",   roman: "t",  },
        { value: "ㅍ", atoms: "ㅍ",   roman: "p",  },
        { value: "ㅎ", atoms: "ㅎ",   roman: "h",  },
    ]);
    INITIALS as ReadonlyArray<JamoDesc>; // type-check

    /**
     * # Medial Jamo (Jungseong)
     */
    const MEDIALS = Object.freeze(<const>[
        { value: "ㅏ", atoms: "ㅏ",   roman: "a",  },
        { value: "ㅐ", atoms: "ㅐ",   roman: "ae", },
        { value: "ㅑ", atoms: "ㅑ",   roman: "ya", },
        { value: "ㅒ", atoms: "ㅒ",   roman: "yae",},
        { value: "ㅓ", atoms: "ㅓ",   roman: "eo", },
        { value: "ㅔ", atoms: "ㅔ",   roman: "e",  },
        { value: "ㅕ", atoms: "ㅕ",   roman: "yeo",},
        { value: "ㅖ", atoms: "ㅖ",   roman: "ye", },
        { value: "ㅗ", atoms: "ㅗ",   roman: "o",  },
        { value: "ㅘ", atoms: "ㅗㅏ", roman: "wa", },
        { value: "ㅙ", atoms: "ㅗㅐ", roman: "wae",},
        { value: "ㅚ", atoms: "ㅗㅣ", roman: "oe", },
        { value: "ㅛ", atoms: "ㅛ",   roman: "yo", },
        { value: "ㅜ", atoms: "ㅜ",   roman: "u",  },
        { value: "ㅝ", atoms: "ㅜㅓ", roman: "wo", },
        { value: "ㅞ", atoms: "ㅜㅔ", roman: "we", },
        { value: "ㅟ", atoms: "ㅜㅣ", roman: "wi", },
        { value: "ㅠ", atoms: "ㅠ",   roman: "yu", },
        { value: "ㅡ", atoms: "ㅡ",   roman: "eu", },
        { value: "ㅢ", atoms: "ㅡㅣ", roman: "ui", },
        { value: "ㅣ", atoms: "ㅣ",   roman: "i",  },
    ]);
    MEDIALS as ReadonlyArray<JamoDesc>; // type-check

    /**
     * # Final Jamo (Jongseong)
     */
    const FINALS = Object.freeze(<const>[
        { value: "",   atoms: "",     roman: "",   },
        { value: "ㄱ", atoms: "ㄱ",   roman: "k",  },
        { value: "ㄲ", atoms: "ㄱㄱ", roman: "k",  },
        { value: "ㄳ", atoms: "ㄱㅅ", roman: "kt", },
        { value: "ㄴ", atoms: "ㄴ",   roman: "n",  },
        { value: "ㄵ", atoms: "ㄴㅈ", roman: "nt", },
        { value: "ㄶ", atoms: "ㄴㅎ", roman: "nt", },
        { value: "ㄷ", atoms: "ㄷ",   roman: "t",  },
        { value: "ㄹ", atoms: "ㄹ",   roman: "l",  },
        { value: "ㄺ", atoms: "ㄹㄱ", roman: "lk", },
        { value: "ㄻ", atoms: "ㄹㅁ", roman: "lm", },
        { value: "ㄼ", atoms: "ㄹㅂ", roman: "lp", },
        { value: "ㄽ", atoms: "ㄹㅅ", roman: "lt", },
        { value: "ㄾ", atoms: "ㄹㅌ", roman: "lt", },
        { value: "ㄿ", atoms: "ㄹㅍ", roman: "lp", },
        { value: "ㅀ", atoms: "ㄹㅎ", roman: "lt", },
        { value: "ㅁ", atoms: "ㅁ",   roman: "m",  },
        { value: "ㅂ", atoms: "ㅂ",   roman: "p",  },
        { value: "ㅄ", atoms: "ㅂㅅ", roman: "pt", },
        { value: "ㅅ", atoms: "ㅅ",   roman: "t",  },
        { value: "ㅆ", atoms: "ㅅㅅ", roman: "t",  },
        { value: "ㅇ", atoms: "ㅇ",   roman: "ng", },
        { value: "ㅈ", atoms: "ㅈ",   roman: "t",  },
        { value: "ㅊ", atoms: "ㅊ",   roman: "t",  },
        { value: "ㅋ", atoms: "ㅋ",   roman: "k",  },
        { value: "ㅌ", atoms: "ㅌ",   roman: "t",  },
        { value: "ㅍ", atoms: "ㅍ",   roman: "p",  },
        { value: "ㅎ", atoms: "ㅎ",   roman: "t",  },
    ]);
    FINALS as ReadonlyArray<JamoDesc>; // type-check

    /**
     * 
     */
    const WEIGHTS = {
        "": 1,
    };

}
