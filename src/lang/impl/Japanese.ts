import { Lang } from "src/lang/Lang";


/**
 * # Japanese
 * 
 * A namespace grouping implementations of {@link Japanese.Hiragana}
 * and {@link Japanese.Katakana} alphabets.
 */
export namespace Japanese {

    /**
     * # Hiragana
     */
    export class Hiragana extends Lang {

        private static SINGLETON?: Hiragana = undefined;

        public static getInstance(): Hiragana {
            if (!(Hiragana.SINGLETON)) {
                Hiragana.SINGLETON = new Hiragana();
                delete Hiragana.INITIALIZER;
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
            "か": { seq: "ka", weight:  537294, },
          //"っ": { seq: "-",  weight:  467350, }, // TODO
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
            "あ": { seq: "a" , weight:  204256, },
            "け": { seq: "ke", weight:  199362, },
            "ど": { seq: "do", weight:  196555, },
            "ん": { seq: "nn", weight:  190068, },
            "え": { seq: "e" , weight:  163664, },
            "よ": { seq: "yo", weight:  154206, },
            "つ": { seq: "tsu",weight:  153999, },
            "や": { seq: "ya", weight:  146156, },
            "そ": { seq: "so", weight:  131611, },
            "わ": { seq: "wa", weight:  123077, },
            "ち": { seq: "chi",weight:   99183, },
            "み": { seq: "mi", weight:   89264, },
            "せ": { seq: "se", weight:   83444, },
            "ろ": { seq: "ro", weight:   73467, },
            "ば": { seq: "ba", weight:   72228, },
            "お": { seq: "o",  weight:   65870, },
            "じ": { seq: "ji", weight:   56857, },
            "べ": { seq: "be", weight:   56005, },
            "ず": { seq: "zu", weight:   53256, },
            "げ": { seq: "ge", weight:   49126, },
            "ほ": { seq: "ho", weight:   48752, },
            "へ": { seq: "he", weight:   47013, },
            "び": { seq: "bi", weight:   32312, },
            "む": { seq: "mu", weight:   31212, },
            "ご": { seq: "go", weight:   26965, },
            "ね": { seq: "ne", weight:   23490, },
            "ぶ": { seq: "bu", weight:   23280, },
            "ぐ": { seq: "gu", weight:   21549, },
            "ぎ": { seq: "gi", weight:   19865, },
            "ひ": { seq: "hi", weight:   19148, },
            "ょ": { seq: "yo", weight:   14425, }, // small
            "づ": { seq: "du", weight:   13125, },
            "ぼ": { seq: "bo", weight:   12402, },
            "ざ": { seq: "za", weight:   12108, },
            "ふ": { seq: "fu", weight:   11606, },
            "ゃ": { seq: "ya", weight:   11522, }, // small
            "ぞ": { seq: "zo", weight:   10047, },
            "ゆ": { seq: "yu", weight:    8486, },
            "ぜ": { seq: "ze", weight:    6893, },
            "ぬ": { seq: "nu", weight:    5124, },
            "ぱ": { seq: "pa", weight:    4349, },
            "ゅ": { seq: "yu", weight:    2755, },
            "ぴ": { seq: "pi", weight:    1608, },
            "ぽ": { seq: "po", weight:    1315, },
            "ぷ": { seq: "pu", weight:     986, },
            "ぺ": { seq: "pe", weight:     477, },
          //"あ": { seq: "a",  weight:     125, }, // small
          //"え": { seq: "e",  weight:     106, }, // small
            "ぢ": { seq: "di", weight:      82, },
        });

        private constructor() {
            super(
                "Japanese Hiragana",
                Hiragana.INITIALIZER,
            );
        }
    }



    /**
     * Katakana
     */
    export class Katakana extends Lang {

        private static SINGLETON?: Katakana = undefined;

        public static getInstance(): Katakana {
            if (!(Katakana.SINGLETON)) {
                Katakana.SINGLETON = new Katakana();
                delete Katakana.INITIALIZER;
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
            "ン": { seq: "nn", weight: 290948, },
            "ル": { seq: "ru", weight: 189442, },
            "ス": { seq: "su", weight: 178214, },
            "ト": { seq: "to", weight: 162802, },
            "ア": { seq: "a",  weight: 127845, },
            "イ": { seq: "i",  weight: 120807, },
            "ラ": { seq: "ra", weight: 117203, },
            "リ": { seq: "ri", weight: 106744, },
            "ク": { seq: "ku", weight:  98209, },
          //"ッ": { seq: "-",  weight:  86894, }, // TODO
            "カ": { seq: "ka", weight:  82982, },
            "シ": { seq: "shi",weight:  80626, },
            "タ": { seq: "ta", weight:  75319, },
            "ロ": { seq: "ro", weight:  75301, },
            "ド": { seq: "do", weight:  74257, },
            "ジ": { seq: "ji", weight:  61171, },
            "フ": { seq: "fu", weight:  61115, },
            "レ": { seq: "re", weight:  60608, },
            "メ": { seq: "me", weight:  60230, },
            "コ": { seq: "ko", weight:  58724, },
            "マ": { seq: "ma", weight:  56123, },
            "プ": { seq: "pu", weight:  54159, },
            "テ": { seq: "te", weight:  53404, },
            "ム": { seq: "mu", weight:  50758, },
            "チ": { seq: "chi",weight:  48437, },
            "バ": { seq: "ba", weight:  44970, },
            "ビ": { seq: "bi", weight:  44462, },
            "グ": { seq: "gu", weight:  40433, },
            "キ": { seq: "ki", weight:  39608, },
            "ウ": { seq: "u",  weight:  39323, },
            "サ": { seq: "sa", weight:  39202, },
            "ニ": { seq: "ni", weight:  38711, },
            "ナ": { seq: "na", weight:  38047, },
            "エ": { seq: "e",  weight:  36458, },
            "ブ": { seq: "bu", weight:  35920, },
            "パ": { seq: "pa", weight:  35416, },
            "セ": { seq: "se", weight:  34883, },
            "オ": { seq: "o",  weight:  34718, },
            "ィ": { seq: "i",  weight:  33747, }, // small
            "デ": { seq: "de", weight:  32665, },
            "ュ": { seq: "yu", weight:  32616, }, // small
            "ミ": { seq: "mi", weight:  29262, },
            "ャ": { seq: "ya", weight:  28144, },
            "ボ": { seq: "bo", weight:  26651, },
            "ダ": { seq: "da", weight:  26396, },
            "ツ": { seq: "tsu",weight:  24541, },
            "ポ": { seq: "ho", weight:  23742, },
            "ベ": { seq: "be", weight:  22755, },
            "ネ": { seq: "ne", weight:  22462, },
            "ガ": { seq: "ga", weight:  22061, },
            "ハ": { seq: "ha", weight:  21839, },
            "ワ": { seq: "wa", weight:  21784, },
            "ソ": { seq: "so", weight:  20784, },
            "ケ": { seq: "ke", weight:  20633, },
            "モ": { seq: "ho", weight:  20070, },
            "ノ": { seq: "no", weight:  19572, },
            "ズ": { seq: "zu", weight:  19240, },
            "ピ": { seq: "pi", weight:  18692, },
            "ホ": { seq: "ho", weight:  18204, },
            "ェ": { seq: "e",  weight:  17817, }, // small
            "ョ": { seq: "yo", weight:  17731, }, // small
            "ペ": { seq: "pe", weight:  14881, },
            "ゴ": { seq: "go", weight:  13931, },
            "ヤ": { seq: "ya", weight:  12526, },
            "ギ": { seq: "gi", weight:  10732, },
            "ヨ": { seq: "yo", weight:  10318, },
            "ザ": { seq: "za", weight:  10144, },
            "ァ": { seq: "a",  weight:  10121, },
            "ゼ": { seq: "ze", weight:   7689, },
            "ヒ": { seq: "hi", weight:   7289, },
            "ヘ": { seq: "he", weight:   7129, },
            "ユ": { seq: "yo", weight:   6653, },
            "ゲ": { seq: "ge", weight:   6481, },
            "ォ": { seq: "o",  weight:   6245, },
            "ヌ": { seq: "nu", weight:   2897, },
            "ゾ": { seq: "zo", weight:   2640, },
            "ヴ": { seq: "vu", weight:   1145, },
          //"ウ": { seq: "u",  weight:   1050, }, // small
            "ヂ": { seq: "di", weight:    149, },
            "ヅ": { seq: "du", weight:    127, },
            "ヲ": { seq: "wo", weight:    122, },
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