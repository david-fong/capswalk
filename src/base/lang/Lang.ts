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
     * @param frontendDescId -
     *
     * @param forwardDict
     * Weights are _relative_ values handled by tree nodes, which
     * require the provided values to all be strictly positive values.
     * Ie. They do not need to sum up to any specific value.
     *
     * @param weightExaggeration -
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
        JsUtils.propNoWrite(this as Lang, [
            "frontendDesc", "treeMap", "leafNodes",
        ]);

        if (DEF.DevAssert && this.leafNodes.length !== this.frontendDesc.numLeaves) {
            throw new Error(`maintenance required: the frontend constant`
            + ` for the language \"${this.frontendDesc.id}\" needs to`
            + ` be updated to the correct, computed value, which is`
            + ` \`${this.leafNodes.length}\`.`);
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
     * a `Lang.Char` to return. Is allowed to contain empty strings,
     * which will be ignored as if those entries did not exist.
     *
     * @requires
     * In order for this language to satisfy these constraints, it must
     * be true that the number of leaf nodes in its tree-structure must
     * provably be greater than the number of non-empty entries in
     * `avoid` for all expected combinations of internal state and
     * passed-arguments under which it could be called.
     */
    public getNonConflictingChar(
        avoid: TU.RoArr<Lang.Seq>,
    ): Lang.CharSeqPair {
        // Wording the spec closer to this implementation: We must find
        // characters from nodes that are not descendants or ancestors
        // of nodes for sequences to avoid. We can be sure that none of
        // the ancestors or descendants of avoid-nodes are avoid-nodes.

        // Start by sorting according to the desired balancing scheme:
        this.leafNodes.sort(LangSeqTree.ParentNode.LEAF_CMP);

        let nodeToHit: LangSeqTree.ChildNode | undefined = undefined;
        for (const leaf of this.leafNodes) {
            // Take the next leaf node (don't remove it!), and if none of
            // its parents are avoid-nodes, then, from the set of nodes
            // including the leaf node and all its parents (minus the root),
            // choose the node with the least actual/personal hit-count.
            const upstreamNodes = leaf.andNonRootParents();
            for (let i = 0; i < upstreamNodes.length; i++) {
                const conflictSeq: Lang.Seq | undefined = avoid.find((avoidSeq) => {
                    return avoidSeq.startsWith(upstreamNodes[i].seq);
                });
                if (conflictSeq) {
                    if (conflictSeq === upstreamNodes[i].seq) {
                        // Cannot use anything on this upstream path because
                        // an avoid-node is directly inside it.
                        upstreamNodes.length = 0;
                    } else {
                        // Found a node on an upstream path of an avoid-node.
                        // Doesn't stop us from using what we've found so far.
                        upstreamNodes.splice(i);
                    }
                    break;
                }
            }
            if (upstreamNodes.length) {
                // Found a non-conflicting upstream node.
                // Find the node with the lowest personal hit-count:
                nodeToHit = upstreamNodes[0];
                for (const node of upstreamNodes) {
                    if (node.ownHits < nodeToHit.ownHits) {
                        nodeToHit = node;
                    }
                }
                break;
            }
        }
        if (nodeToHit === undefined) {
            // Should never reach here because there is a check in the
            // constructor for this invariant.
            throw new Error(`Invariants guaranteeing that a LangSeq can`
            + `always be shuffled-in were not met.`);
        }
        return nodeToHit.chooseOnePair();
    }

    /**
     */
    public simpleView(): object {
        return Object.freeze(Object.assign(Object.create(null), {
            id: this.frontendDesc.id,
            displayName: this.frontendDesc.displayName,
            root: this.treeMap.simpleView(),
            numLeaves: this.leafNodes.length,
        }));
    }
}
export namespace Lang {
    /**
     * Every constructor function (class literal) implementing the
     * `Lang` class must implement this interface.
     */
    export interface ClassIf {
        new (weightScaling: Lang.WeightExaggeration): Lang;
        BUILD(): CharSeqPair.WeightedForwardMap;
    };
    /**
     * Utility functions for implementations to use in their static
     * `.BUILD` function.
     */
    export namespace BuildUtils {
        export function WORD_FOR_WORD(seq2Weight: Record<Lang.Seq,number>): Lang.CharSeqPair.WeightedForwardMap {
            return Object.entries(seq2Weight).reduce<Lang.CharSeqPair.WeightedForwardMap>(
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
    export namespace CharSeqPair {
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
    }

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