import { JsUtils } from "defs/JsUtils";
import { Lang as _Lang } from "defs/TypeDefs";
import { LangDescs } from "./LangDescs";
export { LangDescs } from "./LangDescs";

/** */
const CSP_CACHE = new Map<Lang.Desc["id"], ReadonlyArray<Lang.Csp.Weighted>>();

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

	public readonly csps: ReadonlyArray<Lang.Csp.Weighted>;
	readonly #size: number;

	readonly #weights: Float32Array;
	readonly #hits: Float64Array;
	/**
	 * A linked-list indexing lookup. The last entry's value is the
	 * starting index.
	 */
	readonly #next: Uint16Array;

	/** */
	protected constructor(
		id: Lang.Desc["id"],
		weightExaggeration: Lang.WeightExaggeration,
	) {
		super();
		this.desc = Lang.GetDesc(id);
		this.csps = CSP_CACHE.has(id)
			? CSP_CACHE.get(id)!
			: ((): ReadonlyArray<Lang.Csp.Weighted> => {
				const buildDict = (Object.getPrototypeOf(this).constructor as Lang.ClassIf).BUILD();
				const cspCache = Lang.CreateCspsArray(buildDict);
				CSP_CACHE.set(id, cspCache);
				return cspCache;
			})();
		this.#size = this.csps.length;
		JsUtils.propNoWrite(this as Lang, "desc", "csps");
		{
			const scaleWeight = Lang.GetWeightScalingFn(weightExaggeration, this.desc.avgWeight);
			this.#weights = Float32Array.from(this.csps.map((csp) => scaleWeight(csp.unscaledWt)));
		}
		this.#hits = new Float64Array(this.#size);
		this.#next = new Uint16Array(this.#size + 1);
		Object.seal(this); //🧊
	}

	/** */
	public reset(): void {
		for (let i = 0; i < this.#hits.length; i++) {
			this.#hits[i] = Math.random() * Lang.RESET_NUM_HITS / this.desc.avgWeight;
		}
		const sorter: { _hits: number, cspsIndex: number }[] = [];
		this.#hits.forEach((_hits, cspsIndex) => {
			sorter.push(Object.freeze({ _hits, cspsIndex }));
		});
		sorter.push({ _hits: Infinity, cspsIndex: this.#size });
		sorter.seal().sort((a,b) => a._hits - b._hits).freeze();
		{
			let i = this.#next[this.#size] = sorter[0]!.cspsIndex;
			for (let sortI = 1; sortI < sorter.length; sortI++) {
				i = this.#next[i] = sorter[sortI]!.cspsIndex;
			}
		}
	}

	/**
	 * @returns
	 * A random char whose sequence is not a prefix of anything in
	 * `avoid` and vice versa. Ie. They may share a common prefix as
	 * long as they are both longer than the shared prefix.
	 *
	 * @description
	 * This method is called to shuffle the char-seq pair at some tile
	 * A. `avoid` should contain the lang-sequences from all tiles
	 * reachable by a player occupying any tile B from which they can
	 * also reach A (except for A itself).
	 *
	 * @param avoid
	 * A collection of sequences to avoid conflicts with when choosing
	 * a character to return. Empty-string entries are ignored. Freezing
	 * may result in better performance.
	 *
	 * @requires
	 * The number of leaves in an implementation's tree-structure must
	 * be greater than the number of non-empty entries in `avoid` for
	 * all expected combinations of internal state and passed-arguments
	 * under which it could be called.
	 */
	public getNonConflictingChar(
		avoid: ReadonlyArray<Lang.Seq>,
	): Lang.Csp {
		avoid = avoid.filter((seq) => seq).freeze();
		const next = this.#next;

		for (
			let i = next[this.#size]!, prev = this.#size;
			i !== this.#size;
			prev = i, i = next[i]!
		) {
			const csp = this.csps[i]!;
			if (!avoid.some((avoidSeq) => /*#__INLINE__*/Lang.EitherPrefixesOther(avoidSeq, csp.seq))) {
				this.#hits[i] += 1.0 / this.#weights[i]!;
				let newPrev = i;
				while (
					next[newPrev] !== this.#size
					&& this.#hits[i]! > this.#hits[next[newPrev]!]!
				) { newPrev = next[newPrev]!; }

				if (newPrev !== i) {
					if (DEF.DevAssert && prev === -1) throw new Error("never");
					next[prev] = next[i]!; next[i] = next[newPrev]!; next[newPrev] = i;
				}
				//if (DEF.DevAssert) { this._assertInvariants(); }
				return csp;
			}
		};
		// Enforced by UI and server:
		throw new Error("never");
	}

	/** @internal For development testing purposes. */
	public _assertInvariants(): void {
		const visited: boolean[] = [];
		for (let i = 0; i < this.#size; i++) {
			visited[i] = false;
		}
		visited.seal();
		let i: number = this.#next[this.#size]!;
		let hits = 0;
		for (let _i = 0; _i < this.#size; _i++) {
			if (this.#hits[i]! < hits) {
				throw new Error("lang hits should be ascending");
			}
			hits = this.#hits[i]!;
			visited[i] = true;
			i = this.#next[i]!;
		}
		if (i !== this.#size) {
			throw new Error("lang next should end by looping back");
		}
		if (visited.some((flag) => flag === false)) {
			throw new Error("lang next should be an exhaustive loop");
		}
	}

	/**
	 * These are calculated after changes to the implementation and the
	 * result is cached via hardcoding into LangDescs.ts.
	 */
	public _calcIsolatedMinOpts(): number {
		/** ALl unique sequences sorted in lexical order. */
		const allSeqs: string[] = [];
		this.csps.forEach((n) => {
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
		return [...rootLeaves.values()].sort((a,b) => a-b).slice(0,-1).reduce((sum,n) => sum+n, 0);
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
		BUILD(): ForwardDict;
	};

	/**
	 * @returns `undefined` if no such language descriptor is found.
	 */
	export function GetDesc(langId: Lang.Desc["id"]): Lang.Desc {
		return LangDescs[langId]!;
	}
	Object.freeze(GetDesc);

	/** */
	export async function Import(langId: Lang.Desc["id"]): Promise<Lang.ClassIf> {
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
	Object.freeze(Import);

	/** */
	export function GetWeightScalingFn(
		weightScaling: Lang.WeightExaggeration,
		avgUnscaledWeight: number,
	): (ogWeight: number) => number {
		if (weightScaling === 0) return GetWeightScalingFn.UNIFORM;
		if (weightScaling === 1) return GetWeightScalingFn.IDENTITY;
		return (originalWeight: number) => Math.pow(originalWeight / avgUnscaledWeight, weightScaling);
	};
	export namespace GetWeightScalingFn {
		// Cache the compiled code by extracting the declaration.
		export function UNIFORM(): 1 { return 1; }
		export function IDENTITY(ogWeight: number): number { return ogWeight; }
	}
	Object.freeze(GetWeightScalingFn);

	/**
	 * Does not handle caching.
	 */
	export function CreateCspsArray(forwardDict: Lang.ForwardDict): ReadonlyArray<Lang.Csp.Weighted> {
		return Object.entries(forwardDict).freeze().map(([char, {seq, weight: unscaledWt}]) => {
			return Object.freeze({
				char, seq, unscaledWt,
			});
		})
		.seal()
		//.sort((a,b) => (a.seq < b.seq) ? -1 : (a.seq > b.seq) ? 1 : (a.char < b.char) ? -1 : (a.char > b.char) ? 1 : 0)
		.sort((a,b) => b.unscaledWt - a.unscaledWt)
		// ^Note: Enforcing sort order here is not technically required
		// as long as forwardDict is deterministic in insertion order.
		.freeze();
	}
	Object.freeze(CreateCspsArray);

	/** Somewhat arbitrary. Greater than one. */
	export const RESET_NUM_HITS = 10;

	export function EitherPrefixesOther(a: string, b: string): boolean {
		return (a.length > b.length) ? a.startsWith(b) : b.startsWith(a);
	}

	/**
	 * Utility functions for implementations to use in their static
	 * `.BUILD` function.
	 */
	export namespace BuildUtils {
		export function WORD_FOR_WORD(seq2Weight: Record<Lang.Seq,number>): Lang.ForwardDict {
			return Object.entries(seq2Weight).freeze().reduce<Lang.ForwardDict>(
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
	export type Char = string;

	/**
	 * A sequence of characters each matching {@link SEQ_REGEXP}
	 * that represent the intermediate interface between an Operator
	 * and a `LangChar`. The immediate interface is through the `Lang`
	 * implementation's {@link Lang#remapKey} method.
	 */
	export type Seq = string;

	/**
	 * A key-value pair containing a `LangChar` and its corresponding
	 * `LangSeq`.
	 */
	export interface Csp {
		readonly char: Lang.Char,
		readonly seq:  Lang.Seq,
	};
	export namespace Csp {
		export interface Weighted extends Csp {
			/** Unscaled weight. */
			readonly unscaledWt: number;
		}
	}

	/**
	 * A map from written characters to their corresponding typeable
	 * keyboard sequence and relative spawn weight.
	 *
	 * Shape that must be passed in to the static tree producer. The
	 * `Record` type enforces the invariant that {@link Lang.Char}s are
	 * unique in a {@link Lang}. "CSP" is short for {@link Lang.CharSeqPair}.
	 */
	export type ForwardDict = Record<
		Lang.Char,
		Readonly<{seq: Lang.Seq, weight: number,}>
	>;

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