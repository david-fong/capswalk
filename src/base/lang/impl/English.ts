import { Lang } from "../Lang";


/**
 *
 */
export namespace English {

	/**
	 * # Lowercase (QWERTY)
	 *
	 * https://wikipedia.org/wiki/Keyboard_layout#QWERTY
	 */
	export class Lowercase extends Lang {
		// TODO.learn see https://wikipedia.org/wiki/Keyboard_layout#Dvorak
		// and https://wikipedia.org/wiki/Keyboard_layout#Colemak
		public constructor(weightScaling: number) {
			super("engl-low", weightScaling);
		}
		public static BUILD(): Lang.CharSeqPair.WeightedForwardMap {
			return Lang.BuildUtils.WORD_FOR_WORD(LETTER_FREQUENCY);
		}
	}
	Lowercase as Lang.ClassIf;
	Object.freeze(Lowercase);
	Object.freeze(Lowercase.prototype);


	/**
	 * # Mixed-Case (QWERTY)
	 *
	 * https://wikipedia.org/wiki/Keyboard_layout#QWERTY
	 */
	export class MixedCase extends Lang {
		public constructor(weightScaling: number) {
			super("engl-mix", weightScaling);
		}
		public static BUILD(): Lang.CharSeqPair.WeightedForwardMap {
			let initializer: Lang.CharSeqPair.WeightedForwardMap = {};
			const addMappings = (charSeqTransform: (cs: string) => string): void => {
				initializer = Object.entries(LETTER_FREQUENCY).reduce(
					(accumulator, [_char,weight]) => {
						const char: Lang.Char = charSeqTransform(_char);
						accumulator[char] = { seq: char, weight };
						return accumulator;
					},
					initializer,
				);
			};
			addMappings((cs) => cs.toLowerCase());
			addMappings((cs) => cs.toUpperCase());
			return initializer;
		}
	}
	MixedCase as Lang.ClassIf;
	Object.freeze(MixedCase);
	Object.freeze(MixedCase.prototype);


	export namespace OldCellphone {
		/**
		 * You see letters and type as if on an old cellphone's numeric keypad.
		 */
		export class Encode extends Lang {
			public constructor(weightScaling: number) {
				super("engl-cell-enc", weightScaling);
			}
			public static BUILD(): Lang.CharSeqPair.WeightedForwardMap {
				return Object.entries(LETTER_FREQUENCY).reduce<Lang.CharSeqPair.WeightedForwardMap>(
					(accumulator, [char,weight], index) => {
						accumulator[char] = { seq: NUMPAD[index], weight };
						return accumulator;
					}, {},
				);
			}
		}
		Encode as Lang.ClassIf;
		Object.freeze(Encode);
		Object.freeze(Encode.prototype);

		const NUMPAD = Object.freeze([3,3,3,3,3,4,3,4]
			.flatMap((val, idx) => {
				const button = [];
				const numpadKey = (1+idx).toString();
				for (let str = numpadKey; str.length <= val; str += numpadKey) {
					button.push(str);
				}
				return button;
			})
		);
	}
	Object.freeze(OldCellphone);


	/**
	 * Values obtained from https://wikipedia.org/wiki/Letter_frequency
	 */
	export const LETTER_FREQUENCY = Object.freeze(<Record<string,number>>JSON.parse(`{
		"a": 8.167, "b": 1.492, "c": 2.202, "d": 4.253,
		"e":12.702, "f": 2.228, "g": 2.015, "h": 6.094,
		"i": 6.966, "j": 0.153, "k": 1.292, "l": 4.025,
		"m": 2.406, "n": 6.749, "o": 7.507, "p": 1.929,
		"q": 0.095, "r": 5.987, "s": 6.327, "t": 9.356,
		"u": 2.758, "v": 0.978, "w": 2.560, "x": 0.150,
		"y": 1.994, "z": 0.077
	}`));
	export const LETTER_FREQUENCY_EXT = Object.freeze(Object.assign(
		(() => {
			const freq: Record<string, number> = {
				".": 65.3, ",": 61.3, "\"": 26.7, "'": 24.3, "-": 15.3,
				"?": 5.6, ":": 3.4, "!": 3.3, ";": 3.2,
			};
			for (let i = 0; i < 10; i++) {
				freq[i.toString()] = 10; // TODO.learn what's a good value to use here?
			}
			let sum = 0;
			for (const key in freq) {
				sum += freq[key as keyof typeof freq];
			}
			for (const key in freq) {
				freq[key as keyof typeof freq] *= 8 / sum;
				// ^ above constant: 8 is between the 3rd and 4th top
				// frequencies of alphabet letters in LETTER_FREQUENCY.
			}
			return freq;
		})(),
		LETTER_FREQUENCY,
	));

	/**
	 */
	export namespace Morse {
		/**
		 * You see letters and numbers and you type sequences of dots and dashes.
		 */
		export class Encode extends Lang {
			public constructor(weightScaling: number) {
				super("mors-enc", weightScaling);
			}
			public static BUILD(): Lang.CharSeqPair.WeightedForwardMap {
				const dict: Lang.CharSeqPair.WeightedForwardMap = {};
				for (const [plain,cipher] of Object.entries(Dict)) {
					dict[plain] = { seq: cipher, weight: English.LETTER_FREQUENCY_EXT[plain] };
				}
				return dict;
			}
		}
		Encode as Lang.ClassIf;
		Object.freeze(Encode);
		Object.freeze(Encode.prototype);


		/**
		 * You see dots and dashes and you type alphanumeric characters.
		 */
		export class Decode extends Lang {
			public constructor(weightScaling: number) {
				super("mors-dec", weightScaling);
			}
			public static BUILD(): Lang.CharSeqPair.WeightedForwardMap {
				const dict: Lang.CharSeqPair.WeightedForwardMap = {};
				for (const [plain,cipher] of Object.entries(Dict)) {
					const morse = cipher.replace(/\./g,"•").replace(/\-/g,"−");
					dict[morse] = { seq: plain, weight: English.LETTER_FREQUENCY_EXT[plain] };
				}
				return dict;
			}
		}
		Decode as Lang.ClassIf;
		Object.freeze(Decode);
		Object.freeze(Decode.prototype);

		// Also see https://en.wikipedia.org/wiki/Prosigns_for_Morse_code
		export const Dict = Object.freeze(<Record<string,string>>JSON.parse(`{
			"0": "-----", "5": ".....",
			"1": ".----", "6": "-....",
			"2": "..---", "7": "--...",
			"3": "...--", "8": "---..",
			"4": "....-", "9": "----.",

			"a": ".-"   , "n": "-."   ,
			"b": "-..." , "o": "---"  ,
			"c": "-.-." , "p": ".--." ,
			"d": "-.."  , "q": "--.-" ,
			"e": "."    , "r": ".-."  ,
			"f": "..-." , "s": "..."  ,
			"g": "--."  , "t": "-"    ,
			"h": "...." , "u": "..-"  ,
			"i": ".."   , "v": "...-" ,
			"j": ".---" , "w": ".--"  ,
			"k": "-.-"  , "x": "-..-" ,
			"l": ".-.." , "y": "-.--" ,
			"m": "--"   , "z": "--.." ,

			".": ".-.-.-",
			",": "--..--",
			"?": "..--..",
			"!": "-.-.--",
			"-": "-....-"
		}`));
		// "/": "-..-.",
		// "@": ".--.-.",
		// "(": "-.--.",
		// ")": "-.--.-"
	}
	Object.freeze(Morse);
}
Object.freeze(English);