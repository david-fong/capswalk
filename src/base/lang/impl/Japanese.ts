import { Lang } from "../Lang";
import JapnHirInitializer from "./defs/japn-hir.json5";
import JapnKatInitializer from "./defs/japn-kat.json5";

/**
 * Japanese
 *
 * A namespace grouping implementations of {@link Japanese.Hiragana}
 * and {@link Japanese.Katakana} alphabets.
 */
export namespace Japanese {

	// TODO.impl https://wikipedia.org/wiki/Keyboard_layout#Japanese
	// add INITIALIZER entry field "kana", make hiragana a namespace
	// and separate romanization class from kana-keyboard class.
	/**
	 * Hiragana
	 */
	export class Hiragana extends Lang {
		/**
		 * Values obtained from page 18 of the below pdf (p.499 of text)
		 * https://link.springer.com/content/pdf/10.3758/BF03200819.pdf
		 *
		 * alternate unused source:
		 * https://gawron.sdsu.edu/crypto/japanese_models/hir_freq.html
		 * (https://gawron.sdsu.edu/crypto/lectures/hiragana.html)
		 */
		public static INITIALIZER = Object.freeze(
			JapnHirInitializer as Lang.WeightedForwardMap
		);

		public constructor(weightScaling: number) {
			super("japn-hir", weightScaling);
		}
		public static BUILD(): Lang.WeightedForwardMap {
			return Hiragana.INITIALIZER;
		}
	}
	Hiragana as Lang.ClassIf;
	Object.freeze(Hiragana);
	Object.freeze(Hiragana.prototype);



	/**
	 * Katakana
	 */
	export class Katakana extends Lang {
		/**
		 * Values obtained from page 19 of the below pdf (p.500 of text)
		 * https://link.springer.com/content/pdf/10.3758/BF03200819.pdf
		 */
		public static INITIALIZER = Object.freeze(
			JapnKatInitializer as Lang.WeightedForwardMap
		);

		public constructor(weightScaling: number) {
			super("japn-kat", weightScaling);
		}
		public static BUILD(): Lang.WeightedForwardMap {
			return Katakana.INITIALIZER;
		}
	}
	Katakana as Lang.ClassIf;
	Object.freeze(Katakana);
	Object.freeze(Katakana.prototype);
}
Object.freeze(Japanese);