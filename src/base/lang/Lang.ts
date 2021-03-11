import { JsUtils } from "defs/JsUtils";
import { Lang as _Lang } from "defs/TypeDefs";
import { LangDescs } from "./LangDescs";
export { LangDescs } from "./LangDescs";
import { Csp } from "./LangCsp";

/** This cache helps save memory on the server by sharing parts of tree nodes. */
const DICT_CACHE = new Map<Lang.Desc["id"], ReadonlyArray<Csp>>();

/**
 * Conceptually, a language is a map from unique written characters
 * to corresponding key-sequences. the key-sequences may be non-unique.
 *
 * Operationally, the reverse map is more useful: A a map from typeable
 * key-sequences to sets of language-unique written characters. Support
 * is not needed for retrieving the sequence corresponding to a written
 * character.
 */
export abstract class Lang extends _Lang {

	public readonly desc: Lang.Desc;

	/** A dictionary of char-seq-pair information. */
	public readonly dict: ReadonlyArray<Csp> = undefined!;

	readonly #queue: SealedArray<Csp>;

	/** */
	protected constructor(
		id: Lang.Desc["id"],
		weightExaggeration: Lang.WeightExaggeration,
	) {
		super();
		this.desc = Lang.GET_DESC(id);
		{
			const dictCache = DICT_CACHE.has(id)
				? DICT_CACHE.get(id)!
				: ((): ReadonlyArray<Csp> => {
					const buildDict = (Object.getPrototypeOf(this).constructor as Lang.ClassIf).BUILD();
					const dictCache = Lang.CREATE_DICT_ARRAY(buildDict);
					DICT_CACHE.set(id, dictCache);
					return dictCache;
				})();
			this.dict = dictCache;
			const scaleWeight = Lang._GET_SCALE_WEIGHT_FUNC(weightExaggeration, this.desc.avgWeight);
			this.#queue = dictCache.map((csp) => csp._mkInstance(scaleWeight(csp.weight))).seal();
		}
		JsUtils.propNoWrite(this as Lang, "desc", "dict");
		Object.seal(this); //🧊
	}

	/** */
	public reset(): void {
		for (const csp of this.#queue) {
			csp.reset();
		}
	}

	/**
	 * @returns
	 * A random char in this language whose corresponding sequence is
	 * not a prefix of any `Lang.Seq` in `avoid`, and vice versa. Ie.
	 * They may share a common prefix as long as they are both longer
	 * than the shared prefix.
	 *
	 * @description
	 * This method is called to shuffle the char-seq pair at some tile
	 * A. `avoid` should contain the lang-sequences from all tiles
	 * reachable by a player occupying any tile B from which they can
	 * also reach A (except for A itself).
	 *
	 * @param avoid
	 * A collection of `Lang.Seq`s to avoid conflicts with when choosing
	 * a `Lang.Char` to return. Empty-string entries are ignored. Freezing
	 * may result in better performance.
	 *
	 * @requires
	 * The number of leaves in an implementation's tree-structure must
	 * be greater than the number of non-empty entries in
	 * `avoid` for all expected combinations of internal state and
	 * passed-arguments under which it could be called.
	 */
	public getNonConflictingChar(
		avoid: ReadonlyArray<Lang.Seq>,
	): Lang.CharSeqPair {
		// Start by sorting according to the desired balancing scheme:
		this.#queue.sort(Csp.LEAF_CMP);

		for (const csp of this.#queue) {
			// ^Using `find` is fine. There can only ever be one or none.
			if (!avoid.some((avoidSeq) => avoidSeq.startsWith(csp.seq))) {
				csp.incrHits();
				return Object.freeze(<Lang.CharSeqPair>{
					char: csp.char,
					seq: csp.seq,
				});
			}
		}
		// Enforced by UI and server:
		throw new Error("never");
	}

	/** */
	public _calcIsolatedMinOpts(): number {
		/** ALl unique sequences sorted in lexical order. */
		const allSeqs: string[] = [];
		this.dict.forEach((n) => {
			if (allSeqs[allSeqs.length-1] !== n.seq) { allSeqs.push(n.seq); }
		});
		allSeqs.freeze();

		/** Every other seq is a prefix of one or several of these. */
		const leafSeqs: string[] = [];
		for (const seq of [...allSeqs].seal().reverse().freeze()) {
			if (!leafSeqs.some((leaf) => leaf.startsWith(seq))) {
				leafSeqs.push(seq);
			}
		}
		leafSeqs.freeze();

		/** Every leaf starts with one and only one of these. */
		const rootSeqs: string[] = [];
		for (const seq of allSeqs) {
			if (!rootSeqs.some((root) => root.startsWith(seq))) {
				rootSeqs.push(seq);
			}
		}
		rootSeqs.freeze();

		/** A partition of the leaves according to their roots. */
		const rootLeaves = new Map<string, number>();
		rootSeqs.forEach((root) => rootLeaves.set(root, 0));
		leafSeqs.forEach((leaf) => {
			for (const root of rootSeqs) {
				if (leaf.startsWith(root)) {
					rootLeaves.set(root, rootLeaves.get(root)! + 1);
					break;
				}
			}
		});

		// The number of leaves except those of the root with the most leaves:
		return [...rootLeaves.values()].sort().slice(0,-1).reduce((sum,n) => sum+n, 0);
	}
}
export namespace Lang {
	/**
	 * Every constructor function (class literal) implementing the
	 * `Lang` class must implement this interface.
	 */
	export interface ClassIf {
		new (weightScaling: Lang.WeightExaggeration): Lang;
		/** Note: Does not need to handle caching */
		BUILD(): WeightedForwardMap;
	};

	/**
	 * @returns `undefined` if no such language descriptor is found.
	 */
	export function GET_DESC(langId: Lang.Desc["id"]): Lang.Desc {
		return LangDescs[langId]!;
	}
	Object.freeze(GET_DESC);

	/** */
	export async function IMPORT(langId: Lang.Desc["id"]): Promise<Lang.ClassIf> {
		const desc = LangDescs[langId]!;
		const module = await import(
			/* webpackChunkName: "lang/[request]" */
			`lang/impl/${desc.module}.ts`
		);
		return desc.export.split(".").reduce(
			(nsps, propName) => nsps[propName],
			module[desc.module],
		);
	}
	Object.freeze(IMPORT);

	/** */
	export function _GET_SCALE_WEIGHT_FUNC(
		weightScaling: Lang.WeightExaggeration,
		avgUnscaledWeight: number,
	): (ogWeight: number) => number {
		if (weightScaling === 0) return _GET_SCALE_WEIGHT_FUNC.UNIFORM;
		if (weightScaling === 1) return _GET_SCALE_WEIGHT_FUNC.IDENTITY;
		return (originalWeight: number) => Math.pow(originalWeight / avgUnscaledWeight, weightScaling);
	};
	export namespace _GET_SCALE_WEIGHT_FUNC {
		// Cache the compiled code by extracting the declaration.
		export function UNIFORM(): 1 { return 1; }
		export function IDENTITY(ogWeight: number): number { return ogWeight; }
	}
	Object.freeze(_GET_SCALE_WEIGHT_FUNC);

	/**
	 * Sorts the result by sequence, breaking ties by character. Does
	 * not handle caching.
	 */
	export function CREATE_DICT_ARRAY(forwardDict: Lang.WeightedForwardMap): ReadonlyArray<Csp> {
		return Object.entries(forwardDict).freeze().map(([char, {seq,weight}]) => {
			return new Csp(char, seq, weight);
		})
		.seal()
		.sort((a,b) => a.char.localeCompare(b.char))
		.sort((a,b) => a.seq.localeCompare(b.seq))
		.freeze();
	}
	Object.freeze(CREATE_DICT_ARRAY);

	/**
	 * Utility functions for implementations to use in their static
	 * `.BUILD` function.
	 */
	export namespace BuildUtils {
		export function WORD_FOR_WORD(seq2Weight: Record<Lang.Seq,number>): Lang.WeightedForwardMap {
			return Object.entries(seq2Weight).freeze().reduce<Lang.WeightedForwardMap>(
				(accumulator, [char,weight]) => {
					accumulator[char] = { seq: char, weight };
					return accumulator;
				}, {},
			);
		}
		Object.freeze(WORD_FOR_WORD);
	}

	/**
	 * An atomic unit in a written language that constitutes a single
	 * character. It is completely unique in its language, and has a
	 * single corresponding sequence (string) typeable on a keyboard.
	 */
	export type Char = _Lang.Char;

	/**
	 * A sequence of characters each matching {@link SEQ_REGEXP}
	 * that represent the intermediate interface between an Operator
	 * and a `LangChar`. The immediate interface is through the `Lang`
	 * implementation's {@link Lang#remapKey} method.
	 */
	export type Seq = _Lang.Seq;

	/**
	 * A key-value pair containing a `LangChar` and its corresponding
	 * `LangSeq`.
	 */
	export type CharSeqPair = _Lang.CharSeqPair;

	/**
	 * A map from written characters to their corresponding typeable
	 * keyboard sequence and relative spawn weight.
	 *
	 * Shape that must be passed in to the static tree producer. The
	 * `Record` type enforces the invariant that {@link Lang.Char}s are
	 * unique in a {@link Lang}. "CSP" is short for {@link Lang.CharSeqPair}.
	 */
	export type WeightedForwardMap = Record<
		Lang.Char,
		Readonly<{seq: Lang.Seq, weight: number,}>
	>/* | Readonly<Record<Lang.Seq, number>> */;

	/**
	 * A value used to scale the variance in weights. Passing zero will
	 * cause all weights to be adjusted to equal the average weight.
	 * Passing `1` will cause no adjustment to be made to the weights.
	 * Passing a value greater than one will cause an exaggeration of
	 * the weight distribution.
	 */
	export type WeightExaggeration = _Lang.WeightExaggeration;

	export type Desc = _Lang.Desc;
}
Object.freeze(Lang);
Object.freeze(Lang.prototype);