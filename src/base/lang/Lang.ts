import { JsUtils } from "defs/JsUtils";
import { Lang as _Lang } from "defs/TypeDefs";
import { LangDescs } from "./LangDescs"; export { LangDescs };
import { LangTree } from "./LangTree";

/** This cache helps save memory on the server by sharing parts of tree nodes. */
type ProtoCache = {
	readonly roots: ReadonlyArray<LangTree.Node>;
	readonly avgUnscaledWeight: number;
};
const TREE_PROTO_CACHE = new Map<Lang.Desc["id"], ProtoCache>();

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

	/** A "reverse" map from `LangSeq`s to `LangChar`s. */
	private readonly treeRoots: ReadonlyArray<LangTree.Node>;

	/**
	 * A list of leaf nodes in `treeRoots` sorted in ascending order by
	 * hit-count. Entries should never be removed or added. They will
	 * always be sorted in ascending order of `carryHits`.
	 */
	private readonly leafNodes: LangTree.Node[];

	/** */
	protected constructor(
		id: Lang.Desc["id"],
		weightExaggeration: Lang.WeightExaggeration,
	) {
		super();
		this.desc = Lang.GET_DESC(id)!;

		const cache = TREE_PROTO_CACHE.has(id)
			? TREE_PROTO_CACHE.get(id)!
			: ((): ProtoCache => {
				// Cold load:
				const forwardDict = (Object.getPrototypeOf(this).constructor as Lang.ClassIf).BUILD();
				const values = Object.values(forwardDict).freeze();
				const cache = Object.freeze<ProtoCache>({
					roots: LangTree.Node.CREATE_TREE_PROTO(forwardDict),
					avgUnscaledWeight: values.reduce((sum, next) => sum += next.weight, 0) / values.length,
				});
				TREE_PROTO_CACHE.set(id, cache);
				return cache;
			})();
		this.treeRoots = cache.roots.map((root) => root._mkInstance(
			LangTree._GET_SCALE_WEIGHT_FUNC(weightExaggeration, cache.avgUnscaledWeight),
		)).freeze();

		const leaves = this.treeRoots.map((root) => root.getLeaves());
		this.leafNodes = leaves.flat();
		JsUtils.propNoWrite(this as Lang, "desc", "treeRoots", "leafNodes");
		Object.seal(this); //🧊

		if (DEF.DevAssert) {
			const isolatedMinOpts = leaves.map((l) => l.length).sort().slice(0,-1).reduce((sum,n) => sum+n, 0);
			if (isolatedMinOpts !== this.desc.isolatedMinOpts) {
				throw new Error(`maintenance required: the desc constant for`
				+` the language "${this.desc.id}" needs to be updated to the`
				+` correct, computed value: ${isolatedMinOpts}.`);
			}
		}
	}

	/** */
	public reset(): void {
		for (const root of this.treeRoots) {
			root.reset();
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
		// Internal explainer: We must find characters from nodes that
		// are not descendants or ancestors of nodes in `avoid`. This
		// means that none of the ancestors or descendants of nodes in
		// `avoid` are also in `avoid`.

		// Start by sorting according to the desired balancing scheme:
		this.leafNodes.sort(LangTree.Node.LEAF_CMP);

		search_branch:
		for (const leaf of this.leafNodes) {
			let hitNode = leaf;
			for (
				let node: LangTree.Node | undefined = leaf;
				node !== undefined;
				node = node.parent
			) {
				const superSeq = avoid.find((avoidSeq) => avoidSeq.startsWith(node!.seq));
				// ^Using `find` is fine. There can only ever be one or none.
				if (superSeq) {
					if (superSeq.length > node.seq.length) {
						// Nothing shorter/upstream will work.
						break;
					} else {
						// Branch contains an avoid node.
						continue search_branch;
					}
				}
				// Find the node with the lowest personal hit-count:
				if (node.ownHits < hitNode.ownHits) {
					hitNode = node;
				}
			}
			return hitNode.chooseOnePair();
		}
		// Enforced by UI and server:
		throw new Error("never");
	}
}
export namespace Lang {
	/**
	 * Every constructor function (class literal) implementing the
	 * `Lang` class must implement this interface.
	 */
	export interface ClassIf {
		new (weightScaling: Lang.WeightExaggeration): Lang;
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