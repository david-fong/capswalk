import { JsUtils } from "defs/JsUtils";
import { Lang as _Lang } from "defs/TypeDefs";

import { LangSeqTree } from "./LangSeqTreeNode";

/**
 * A language is a map from a collection of unique characters to
 * corresponding key-sequences. the key-sequences may be non-unique.
 * (try searching up "Chinese riddle where each syllable is pronounced
 * 'shi'"). A character may have more than one corresponding sequence,
 * representing alternate "spellings" (ways of typing it).
 *
 * ### From Typeable Sequences to Written Characters
 *
 * To the game internals, the reverse thinking is more important: As
 * a map from typeable key-sequences to sets of language-unique written
 * characters (no character is mapped by multiple key-sequences). We
 * do not require support for retrieving the sequence corresponding to
 * a written character.
 *
 * ### Implementation Guide
 *
 * See the readme in [the implementations folder](./impl/readme.md)
 * for a guide on writing implementations of this class.
 */
export abstract class Lang extends _Lang {

	public readonly frontendDesc: Lang.FrontendDesc;

	/**
	 * A "reverse" map from `LangSeq`s to `LangChar`s.
	 */
	private readonly treeMap: LangSeqTree.ParentNode;

	/**
	 * A list of leaf nodes in `treeMap` sorted in ascending order by
	 * hit-count. Entries should never be removed or added. They will
	 * always be sorted in ascending order of `tricklingHitCount`.
	 */
	private readonly leafNodes: Array<LangSeqTree.ChildNode>;

	public get numLeaves(): number { return this.leafNodes.length; }


	/**
	 */
	protected constructor(
		frontendDescId: Lang.FrontendDesc["id"],
		weightExaggeration: Lang.WeightExaggeration,
	) {
		super();
		this.frontendDesc = Lang.GET_FRONTEND_DESC_BY_ID(frontendDescId)!;
		this.treeMap = LangSeqTree.ParentNode.CREATE_TREE_MAP(
			(Object.getPrototypeOf(this).constructor as Lang.ClassIf).BUILD(),
			weightExaggeration,
		);
		this.leafNodes = this.treeMap.getLeaves();
		JsUtils.propNoWrite(this as Lang, "frontendDesc", "treeMap", "leafNodes");
		Object.seal(this); //🧊

		if (DEF.DevAssert && this.leafNodes.length !== this.frontendDesc.numLeaves) {
			throw new Error(`maintenance required: the frontend constant`
			+` for the language \"${this.frontendDesc.id}\" needs to`
			+` be updated to the correct, computed value, which is`
			+` \`${this.leafNodes.length}\`.`);
		}
	}

	/**
	 */
	public reset(): void {
		this.treeMap.reset();
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
		avoid: TU.RoArr<Lang.Seq>,
	): Lang.CharSeqPair {
		// Internal explainer: We must find characters from nodes that
		// are not descendants or ancestors of nodes in `avoid`. This
		// means that none of the ancestors or descendants of nodes in
		// `avoid` are also in `avoid`.

		// Start by sorting according to the desired balancing scheme:
		this.leafNodes.sort(LangSeqTree.ParentNode.LEAF_CMP);

		search_branch:
		for (const leaf of this.leafNodes) {
			let hitNode = leaf;
			for (
				let node: LangSeqTree.ChildNode | undefined = leaf;
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
		throw new Error(`never. Invariants guaranteeing that a LangSeq`
		+` can always be shuffled-in were not met.`);
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
	 * Utility functions for implementations to use in their static
	 * `.BUILD` function.
	 */
	export namespace BuildUtils {
		export function WORD_FOR_WORD(seq2Weight: Record<Lang.Seq,number>): Lang.WeightedForwardMap {
			return Object.freeze(Object.entries(seq2Weight)).reduce<Lang.WeightedForwardMap>(
				(accumulator, [char,weight]) => {
					accumulator[char] = { seq: char, weight };
					return accumulator;
				}, {},
			);
		}
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

	export type FrontendDesc = _Lang.FrontendDesc;
}
Object.freeze(Lang);
Object.freeze(Lang.prototype);