import { Lang as _Lang } from "defs/TypeDefs";
import type { Lang } from "./Lang";
type LangSorter<T> = (a: T, b: T) => number;

/** */
export class Csp {

	declare public readonly char: Lang.Char;
	declare public readonly seq: Lang.Seq;
	/**
	 * Relative to other characters in the language. Higher values
	 * means higher shuffle-in frequencies. A character with weight
	 * N times that of some other character will be returned N times
	 * more often by the `chooseOnePair` method.
	 */
	declare public readonly weight: number;

	/** Weighted according to the weight property. */
	declare public hits: number;

	/** */
	public constructor(
		char: Lang.Char,
		seq: Lang.Seq,
		weight: number,
	) {
		Object.defineProperties(this, {
			"char":   { value: char },
			"seq":    { value: seq },
			"weight": { value: weight },
			"hits":   { value: 0, writable: true }
		});
		Object.seal(this); //🧊
	}
	public _mkInstance(weight: number): Csp {
		// Note: Using `Object.create` is 4x slower on v8.
		/*return Object.create(this, {
			"weight": { value: weight },
			"hits":   { value: 0, writable: true },
		});*/
		return new Csp(this.char, this.seq, this.weight);
	}
	/** */
	public reset(): void {
		this.hits = 0.0;
		this.incrHits(Math.random() * _Lang.CHAR_HIT_COUNT_SEED_CEILING);
	}
	/** */
	public incrHits(numTimes: number = 1): void {
		this.hits += numTimes / this.weight;
	}
	/** */
	public static readonly LEAF_CMP: LangSorter<Csp> = (a, b) => {
		return a.hits - b.hits;
	};
}
Object.freeze(Csp);
Object.freeze(Csp.prototype);