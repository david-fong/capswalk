import { Lang } from "../Lang";


/**
 * # Korean
 *
 * [Frequency data](https://www.koreascience.or.kr/article/JAKO201514751644957.page).
 * Another paper (that I didn't use): https://www.koreascience.or.kr/article/JAKO201507158233900.page
 *
 * I have normalized jamo frequency values to an average value of one.
 * In the above data sources there is no data for when a character has
 * no final jamo. I looked at [this](https://en.wiktionary.org/wiki/Wiktionary:Frequency_lists/Korean_5800)
 * to make an estimate for that value.
 *
 * https://wikipedia.org/wiki/Hangul_consonant_and_vowel_tables#Hangul_syllables
 * https://wikipedia.org/wiki/Korean_language_and_computers#Hangul_in_Unicode
 * https://wikipedia.org/wiki/Hangul_Jamo_(Unicode_block)
 */
export namespace Korean {

	/**
	 * # Dubeolsik (3-row layout)
	 *
	 * https://wikipedia.org/wiki/Keyboard_layout#Dubeolsik
	 * https://www.branah.com/korean
	 */
	export class Dubeolsik extends Lang {
		private static readonly DUB_KEYBOARD = Object.freeze(<const>{
			"": "",
			"ㅂ": "q", "ㅈ": "w", "ㄷ": "e", "ㄱ": "r", "ㅅ": "t",
			"ㅛ": "y", "ㅕ": "u", "ㅑ": "i", "ㅐ": "o", "ㅔ": "p",
			"ㅁ": "a", "ㄴ": "s", "ㅇ": "d", "ㄹ": "f", "ㅎ": "g",
			"ㅗ": "h", "ㅓ": "j", "ㅏ": "k", "ㅣ": "l",
			"ㅋ": "z", "ㅌ": "x", "ㅊ": "c", "ㅍ": "v", "ㅠ": "b",
			"ㅜ": "n", "ㅡ": "m",
			"ㅃ": "Q", "ㅉ": "W", "ㄸ": "E", "ㄲ": "R", "ㅆ": "T",
			"ㅒ": "O", "ㅖ": "P",
		});

		public constructor(weightScaling: number) {
			super("kore-dub", weightScaling);
		}
		public static BUILD(): Lang.WeightedForwardMap {
			return INITIALIZE((ij, mj, fj) => {
				type Atoms = Array<keyof typeof Dubeolsik.DUB_KEYBOARD>;
				const atoms = ([ij, mj, fj].flatMap((jamos) => jamos.atoms.split("")) as Atoms).freeze();
				return atoms.map((atom) => Dubeolsik.DUB_KEYBOARD[atom]).join("");
			});
		}
	}
	Dubeolsik as Lang.ClassIf;
	Object.freeze(Dubeolsik);
	Object.freeze(Dubeolsik.prototype);


	/**
	 * # Sebeolsik (5-row layout)
	 *
	 * \*Note: the branah link below is to an earlier version of
	 * Sebeolsik, [Sebeolsik 390](https://wikipedia.org/wiki/Keyboard_layout#Sebeolsik_390).
	 *
	 * https://wikipedia.org/wiki/Keyboard_layout#Sebeolsik_Final
	 * https://www.branah.com/sebeolsik
	 */
	export class Sebeolsik extends Lang {
		private static readonly SEB_KEYBOARD = Object.freeze(<const>{
			// Finals and consonant clusters are found on the left.
			FINALS: {
				"": "",
				"ㅎ": "1", "ㅆ": "2", "ㅂ": "3", // 1-row
				"ㅅ": "q", "ㄹ": "w", // q-row
				"ㅇ": "a", "ㄴ": "s", // a-row
				"ㅁ": "z", "ㄱ": "x", // z-row
				"ㄲ": "!", "ㄺ": "@", "ㅈ": "#", "ㄿ": "$", "ㄾ": "%", // !-row
				"ㅍ": "Q", "ㅌ": "W", "ㄵ": "E", "ㅀ": "R", "ㄽ": "T", // Q-row
				"ㄷ": "A", "ㄶ": "S", "ㄼ": "D", "ㄻ": "F", // A-row
				"ㅊ": "Z", "ㅄ": "X", "ㅋ": "C", "ㄳ": "V", // Z-row
			},
			// Medials are found in the middle.
			MEDIALS: {
				"ㅛ": "4", "ㅠ": "5", "ㅑ": "6", "ㅖ": "7", "ㅢ": "8", // "ㅜ": "9",
				"ㅕ": "e", "ㅐ": "r", "ㅓ": "t", // q-row
				"ㅣ": "d", "ㅏ": "f", "ㅡ": "g", // a-row
				"ㅔ": "c", "ㅗ": "v", "ㅜ": "b", // z-row
				"ㅒ": "G",
				// Things that don't have dedicated keys:
				"ㅘ": "vf", "ㅙ": "vr", "ㅚ": "vd", "ㅝ": "bt", "ㅞ": "bc", "ㅟ": "bd",
			},
			// Initials are found on the right.
			INITIALS: {
				"ㅋ": "0", // 1-row
				"ㄹ": "y", "ㄷ": "u", "ㅁ": "i", "ㅊ": "o", "ㅍ": "p", // q-row
				"ㄴ": "h", "ㅇ": "j", "ㄱ": "k", "ㅈ": "l", "ㅂ": ";", "ㅌ": "'", // a-row
				"ㅅ": "n", "ㅎ": "m", // z-row
				"ㄲ": "!",  // !-row
				// NOTE: If we included numbers, this is where they would go.
				// Things that don't have dedicated keys:
				"ㄸ": "uu", "ㅃ": ";;", "ㅆ": "nn", "ㅉ": "l",
			},
		});

		public constructor(weightScaling: number) {
			super("kore-sub", weightScaling);
		}
		public static BUILD(): Lang.WeightedForwardMap {
			return INITIALIZE((ij, mj, fj) => {
				return Sebeolsik.SEB_KEYBOARD.INITIALS[ij.value]
					+ Sebeolsik.SEB_KEYBOARD.MEDIALS[mj.value]
					+ Sebeolsik.SEB_KEYBOARD.FINALS[fj.value];
			});
		}
	}
	Sebeolsik as Lang.ClassIf;
	Object.freeze(Sebeolsik);
	Object.freeze(Sebeolsik.prototype);


	/**
	 * # Korean Romanization
	 *
	 * https://wikipedia.org/wiki/Revised_Romanization_of_Korean#Transcription_rules
	 * https://wikipedia.org/wiki/Romanization_of_Korean#Systems
	 * https://www.korean.go.kr/front_eng/roman/roman_01.do
	 */
	export class Romanization extends Lang {
		public constructor(weightScaling: number) {
			super("kore-rom", weightScaling);
		}
		public static BUILD(): Lang.WeightedForwardMap {
			return INITIALIZE((ij, mj, fj) => {
				return ij.roman + mj.roman + fj.roman;
			});
		}
	}
	Romanization as Lang.ClassIf;
	Object.freeze(Romanization);
	Object.freeze(Romanization.prototype);


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
	const INITIALIZE = (
		seqBuilder: SeqBuilder,
	): Lang.WeightedForwardMap => {
		const forwardDict: Lang.WeightedForwardMap = {};
		INITIALS.forEach((initialJamo, initialIdx) => {
			MEDIALS.forEach((medialJamo, medialIdx) => {
				FINALS.forEach((finalJamo, finalIdx) => {
					// base + f + F(m + Mi)
					let offset = initialIdx;
					offset = MEDIALS.length * offset + medialIdx;
					offset =  FINALS.length * offset + finalIdx;
					const char = String.fromCharCode(UNICODE_HANGUL_SYLLABLES_BASE + offset);
					forwardDict[char] = {
						seq: seqBuilder(initialJamo, medialJamo, finalJamo),
						weight: initialJamo.freq * medialJamo.freq * finalJamo.freq,
						// TODO.impl remove the above fallback once weights dict gets implemented.
						//   Also then fix the internal `averageWeight` argument in each implementation.
					};
				});
			});
		});
		return forwardDict;
	};
	type SeqBuilder = { (
		ij: typeof INITIALS[number],
		mj: typeof MEDIALS[number],
		fj: typeof FINALS[number],
	): Lang.Seq, };

	/**
	 * # Initial Jamo (Choseong)
	 */
	const INITIALS = Object.freeze(<const>[
		{ value: "ㄱ", atoms: "ㄱ",   roman: "g" , freq: 2.508206 },
		{ value: "ㄲ", atoms: "ㄱㄱ", roman: "kk", freq: 0.139215 },
		{ value: "ㄴ", atoms: "ㄴ",   roman: "n" , freq: 1.278464 },
		{ value: "ㄷ", atoms: "ㄷ",   roman: "d" , freq: 1.715174 },
		{ value: "ㄸ", atoms: "ㄷㄷ", roman: "tt", freq: 0.155508 },
		{ value: "ㄹ", atoms: "ㄹ",   roman: "r" , freq: 1.306990 },
		{ value: "ㅁ", atoms: "ㅁ",   roman: "m" , freq: 0.920276 },
		{ value: "ㅂ", atoms: "ㅂ",   roman: "b" , freq: 0.768992 },
		{ value: "ㅃ", atoms: "ㅂㅂ", roman: "pp", freq: 0.034349 },
		{ value: "ㅅ", atoms: "ㅅ",   roman: "s" , freq: 1.620272 },
		{ value: "ㅆ", atoms: "ㅅㅅ", roman: "ss", freq: 0.062508 },
		{ value: "ㅇ", atoms: "ㅇ",   roman: "-" , freq: 4.509884 }, // TODO.learn "-" ? see wikipedia
		{ value: "ㅈ", atoms: "ㅈ",   roman: "j" , freq: 1.603205 },
		{ value: "ㅉ", atoms: "ㅈㅈ", roman: "jj", freq: 0.043767 },
		{ value: "ㅊ", atoms: "ㅊ",   roman: "ch", freq: 0.428943 },
		{ value: "ㅋ", atoms: "ㅋ",   roman: "k" , freq: 0.103017 },
		{ value: "ㅌ", atoms: "ㅌ",   roman: "t" , freq: 0.228492 },
		{ value: "ㅍ", atoms: "ㅍ",   roman: "p" , freq: 0.212015 },
		{ value: "ㅎ", atoms: "ㅎ",   roman: "h" , freq: 1.360725 },
	]);
	INITIALS as TU.RoArr<JamoDesc>; // type-check

	/**
	 * # Medial Jamo (Jungseong)
	 */
	const MEDIALS = Object.freeze(<const>[
		{ value: "ㅏ", atoms: "ㅏ",   roman: "a"  , freq: 4.559484 },
		{ value: "ㅐ", atoms: "ㅐ",   roman: "ae" , freq: 0.970054 },
		{ value: "ㅑ", atoms: "ㅑ",   roman: "ya" , freq: 0.150865 },
		{ value: "ㅒ", atoms: "ㅒ",   roman: "yae", freq: 0.008922 },
		{ value: "ㅓ", atoms: "ㅓ",   roman: "eo" , freq: 2.231959 },
		{ value: "ㅔ", atoms: "ㅔ",   roman: "e"  , freq: 0.932004 },
		{ value: "ㅕ", atoms: "ㅕ",   roman: "yeo", freq: 1.000171 },
		{ value: "ㅖ", atoms: "ㅖ",   roman: "ye" , freq: 0.105095 },
		{ value: "ㅗ", atoms: "ㅗ",   roman: "o"  , freq: 2.040807 },
		{ value: "ㅘ", atoms: "ㅗㅏ", roman: "wa" , freq: 0.385060 },
		{ value: "ㅙ", atoms: "ㅗㅐ", roman: "wae", freq: 0.026550 },
		{ value: "ㅚ", atoms: "ㅗㅣ", roman: "oe" , freq: 0.236245 },
		{ value: "ㅛ", atoms: "ㅛ",   roman: "yo" , freq: 0.223892 },
		{ value: "ㅜ", atoms: "ㅜ",   roman: "u"  , freq: 1.402448 },
		{ value: "ㅝ", atoms: "ㅜㅓ", roman: "wo" , freq: 0.135821 },
		{ value: "ㅞ", atoms: "ㅜㅔ", roman: "we" , freq: 0.004818 },
		{ value: "ㅟ", atoms: "ㅜㅣ", roman: "wi" , freq: 0.112462 },
		{ value: "ㅠ", atoms: "ㅠ",   roman: "yu" , freq: 0.111584 },
		{ value: "ㅡ", atoms: "ㅡ",   roman: "eu" , freq: 2.727101 },
		{ value: "ㅢ", atoms: "ㅡㅣ", roman: "ui" , freq: 0.425688 },
		{ value: "ㅣ", atoms: "ㅣ",   roman: "i"  , freq: 3.208973 },
	]);
	MEDIALS as TU.RoArr<JamoDesc>; // type-check

	/**
	 * # Final Jamo (Jongseong)
	 */
	const FINALS = Object.freeze(<const>[
		{ value: "",   atoms: "",     roman: "" , freq: 17.061190 },
		{ value: "ㄱ", atoms: "ㄱ",   roman: "k" , freq: 1.109483 },
		{ value: "ㄲ", atoms: "ㄱㄱ", roman: "k" , freq: 0.016359 },
		{ value: "ㄳ", atoms: "ㄱㅅ", roman: "kt", freq: 0.000962 },
		{ value: "ㄴ", atoms: "ㄴ",   roman: "n" , freq: 3.580456 },
		{ value: "ㄵ", atoms: "ㄴㅈ", roman: "nt", freq: 0.007522 },
		{ value: "ㄶ", atoms: "ㄴㅎ", roman: "nt", freq: 0.081892 },
		{ value: "ㄷ", atoms: "ㄷ",   roman: "t" , freq: 0.049969 },
		{ value: "ㄹ", atoms: "ㄹ",   roman: "l" , freq: 2.094454 },
		{ value: "ㄺ", atoms: "ㄹㄱ", roman: "lk", freq: 0.019761 },
		{ value: "ㄻ", atoms: "ㄹㅁ", roman: "lm", freq: 0.011711 },
		{ value: "ㄼ", atoms: "ㄹㅂ", roman: "lp", freq: 0.005885 },
		{ value: "ㄽ", atoms: "ㄹㅅ", roman: "lt", freq: 0.000013 },
		{ value: "ㄾ", atoms: "ㄹㅌ", roman: "lt", freq: 0.000353 },
		{ value: "ㄿ", atoms: "ㄹㅍ", roman: "lp", freq: 0.000210 },
		{ value: "ㅀ", atoms: "ㄹㅎ", roman: "lt", freq: 0.008150 },
		{ value: "ㅁ", atoms: "ㅁ",   roman: "m" , freq: 0.697015 },
		{ value: "ㅂ", atoms: "ㅂ",   roman: "p" , freq: 0.360526 },
		{ value: "ㅄ", atoms: "ㅂㅅ", roman: "pt", freq: 0.069739 },
		{ value: "ㅅ", atoms: "ㅅ",   roman: "t" , freq: 0.308934 },
		{ value: "ㅆ", atoms: "ㅅㅅ", roman: "t" , freq: 0.590913 },
		{ value: "ㅇ", atoms: "ㅇ",   roman: "ng", freq: 1.663950 },
		{ value: "ㅈ", atoms: "ㅈ",   roman: "t" , freq: 0.046297 },
		{ value: "ㅊ", atoms: "ㅊ",   roman: "t" , freq: 0.026808 },
		{ value: "ㅋ", atoms: "ㅋ",   roman: "k" , freq: 0.000814 },
		{ value: "ㅌ", atoms: "ㅌ",   roman: "t" , freq: 0.068318 },
		{ value: "ㅍ", atoms: "ㅍ",   roman: "p" , freq: 0.045664 },
		{ value: "ㅎ", atoms: "ㅎ",   roman: "t" , freq: 0.002595 },
	]);
	FINALS as TU.RoArr<JamoDesc>; // type-check
}
Object.freeze(Korean);