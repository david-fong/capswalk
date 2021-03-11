import { Lang } from "../Lang";
import Ngram2Dict from "./defs/ngram2.json";
import Ngram3Dict from "./defs/ngram3.json";
Object.freeze(Ngram2Dict);
Object.freeze(Ngram3Dict);

/**
 */
export namespace Ngrams {

	/**
	 * # English Bigrams
	 */
	export class Ngram2 extends Lang {
		public constructor(weightScaling: number) {
			super("ngram2", weightScaling);
		}
		public static BUILD(): Lang.WeightedForwardMap {
			return Lang.BuildUtils.WORD_FOR_WORD(Ngram2Dict);
		}
	}
	Ngram2 as Lang.ClassIf;
	Object.freeze(Ngram2);
	Object.freeze(Ngram2.prototype);

	/**
	 * # English Trigrams
	 */
	export class Ngram3 extends Lang {
		public constructor(weightScaling: number) {
			super("ngram3", weightScaling);
		}
		public static BUILD(): Lang.WeightedForwardMap {
			return Lang.BuildUtils.WORD_FOR_WORD(Ngram3Dict);
		}
	}
	Ngram3 as Lang.ClassIf;
	Object.freeze(Ngram3);
	Object.freeze(Ngram3.prototype);
}
Object.freeze(Ngrams);