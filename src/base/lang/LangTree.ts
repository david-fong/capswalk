import { Lang as _Lang } from "defs/TypeDefs";
import type { Lang } from "./Lang";
type LangSorter<T> = (a: T, b: T) => number;

/** */
export class Node {

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
		});
		Object.seal(this); //🧊
	}
	public _mkInstance(weight: number): Node {
		return Object.create(this, {
			"weight": { value: weight },
			"hits":   { value: 0, writable: true },
		});
	}
	/** */
	public reset(): void {
		this.hits = 0.0;
	}

	/** */
	public incrHits(numTimes: number = 1): void {
		this.hits += numTimes / this.weight;
	}

	/** */
	public static readonly LEAF_CMP: LangSorter<Node> = (a, b) => {
		return a.hits - b.hits;
	};
}
Object.freeze(Node);
Object.freeze(Node.prototype);