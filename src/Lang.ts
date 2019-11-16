import { Defs } from "src/Defs";
import { LangSeqTreeNode, WeightedCspForwardMap, BalancingScheme } from "src/LangSeqTreeNode";

/**
 * All `Lang` implementations should put their module file names
 * here so that they can be dynamically loaded later.
 * 
 * TODO: use this in the privileged settings.
 */
export const LANG_MODULE_PATHS: ReadonlyArray<string> = [
    "English",
].map((filename) => {
    // This test is somewhat arbitrary.
    if (!(/[A-Z][a-zA-Z]*/.test(filename))) {
        throw new Error(`filename ${filename} does not match PascalCase.`);
    }
    return `src/lang/${filename}`;
});



/**
 * An atomic unit in a written language that constitutes a single
 * character. It is completely unique in its language, and has a
 * single corresponding sequence (string) typeable on a keyboard.
 */
export type LangChar = string;

/**
 * A sequence of characters each matching {@link LANG_SEQ_REGEXP}
 * that represent the intermediate interface between an Operator
 * and a `LangChar`. The immediate interface is through the `Lang`
 * implementation's {@link Lang#remapKey} method.
 */
export type LangSeq = string;

/**
 * The choice of this pattern is not out of necessity, but following
 * the mindset of spec designers when they mark something as reserved:
 * For the language implementations I have in mind, I don't see the
 * need to include characters other than these.
 * 
 * Characters that must never be unmarked as reserved (state reason):
 * (currently none. update as needed)
 */
export const LANG_SEQ_REGEXP = new RegExp("^[a-zA-Z\-.]+$");

/**
 * A key-value pair containing a `LangChar` and its corresponding
 * `LangSeq`.
 */
export type LangCharSeqPair = {
    readonly char: LangChar,
    readonly seq:  LangSeq,
} | {
    readonly char: null,
    readonly seq:  null,
};



/**
 * A `Lang`(uage) is a map from a collection of unique characters to
 * corresponding key-sequences. the key-sequences may be non-unique.
 * (try searching up "Chinese riddle where each syllable is pronounced
 * 'shi'"). A character may have more than one corresponding sequence,
 * representing alternate "spellings" (ways of typing it).
 * 
 * In the use-case of this game, it is more helpful to think in the
 * reverse direction: As a map from typable-key-sequences to sets of
 * corresponding unique characters (no character is mapped by multiple
 * key-sequences). This game does not require support for retreiving
 * the `LangSeq` corresponding to a `LangChar`.
 */
export abstract class Lang {

    /**
     * The name of this language.
     */
    public readonly name: string;

    /**
     * A "reverse" map from `LangSeq`s to `LangChar`s.
     */
    protected readonly treeMap: LangSeqTreeNode;

    /**
     * A list of leaf nodes in `treeMap` sorted in ascending order by
     * hit-count. Entries should never be removed or added. They should
     * always be sorted in ascending order of `tricklingHitCount`.
     */
    protected readonly leafNodes: Array<LangSeqTreeNode>;



    /**
     * Implementations should follow a singleton pattern.
     * 
     * @returns `null`. This is just here as a reminder of the interface.
     */
    public static getInstance(): Lang | null {
        return null;
    }

    /**
     * 
     * @param name - 
     * @param forwardDict - Note: weights are relative values handled
     *      by {@link LangSeqTreeNode}. They do not all need to sum to
     *      a specific value such as 100.
     */
    protected constructor(name: string, forwardDict: WeightedCspForwardMap) {
        // Write JSON data to my `dict`:
        this.treeMap = LangSeqTreeNode.CREATE_TREE_MAP(forwardDict);
        this.leafNodes = this.treeMap.getLeafNodes();

        // TODO: This is implementation specific. If the code is ever
        // made to handle more complex connections (Ex. hexagon tiling
        // or variable neighbours through graph structures), then this
        // must change to account for that.
        if (this.leafNodes.length < Defs.MAX_NUM_U2NTS) {
            throw new Error(`The provided mappings composing the current`
                + `Lang-under-construction are not sufficient to ensure that`
                + `a shuffling operation will always be able to find a safe`
                + `candidate to use as a replacement. Please see the spec`
                + `for ${Lang.prototype.getNonConflictingChar.name}.`
            );
        }
        this.reset();
    }

    public reset(): void {
        this.treeMap.reset();
    }



    /**
     * 
     * This can be used, for example, for basic practical purposes like
     * changing all letters to lowercase for the English language, or for
     * more interesting things like mapping halves of the keyboard to a
     * binary-like value like the dots and dashes in morse, or zeros and
     * ones in binary. It could even be used for some crazy challenges like
     * remapping the alphabet by barrel-shifting it so that pressing "a"
     * produces "b", and "b" produces "c", and so on.
     * 
     * The output should either equal the input (in cases that the input
     * is already relevant to the `Lang` at hand and is intended to be
     * taken as-is (ex. typing "a" produces / corresponds to "a" in
     * regular English), or in cases where the input is completely
     * irrelevant before and after remapping), or be a translation to
     * some character that is relevant to the `Lang` and hand, and that
     * matches against {@link LANG_SEQ_REGEXP}. This behaviour is not
     * checked or mandated, and will not result in errors in cases of
     * deviation (see {@link HumanPlayer#seqBufferAcceptKey}), but is
     * the only behaviour that makes any sense.
     * 
     * @param input - Never `null`.
     * @returns Never `null`.
     */
    public abstract remapKey(input: string): string;



    /**
     * @returns a random `LangChar` in this `Lang` whose corresponding
     * `LangSeq` is not a prefix of any `LangSeq` in `avoid`, and vice
     * versa. They may share a common prefix as long as they are both
     * longer in length than the shared prefix, and they are not equal
     * to one another.
     * 
     * This method is called to shuffle the `LangChar` / `LangSeq` pair
     * at some {@link Tile} `A`. `avoid` should contain the `LangSeq`s
     * from all {@link Tile}s reachable by a human {@link Player} occupying
     * a {@link Tile} `B` from which they can also reach `A`
     * 
     * In order for this `Lang` to satisfy these constraints, it must
     * be true that the number of leaf nodes in this tree-structure must
     * `avoid` argument.
     * 
     * In this implementation, a human {@link Player} can only reach a
     * {@link Tile} whose {@link Tile#pos} has an `infNorm` of `1` from
     * that of the {@link Tile} they are currently occupying. That is,
     * `avoid` contains `LangSeq`s from all {@link Tile}s with an `infNorm`
     * <= `2` from the {@link Tile} to shuffle (not including itself).
     * This means that here, the size of `avoid` is always bounded by
     * `(2*2 + 1)^2 - 1 == 24`. Using the English alphabet (26 typable-
     * letters), this requirement is met by a hair.
     * 
     * @param avoid A collection of `LangSeq`s to avoid conflicts with
     *      when choosing a `LangChar` to return.
     * @param balancingScheme - 
     */
    public getNonConflictingChar(
        avoid: ReadonlyArray<LangSeq>,
        balancingScheme: BalancingScheme,
    ): LangCharSeqPair {
        // Wording the spec closer to this implementation: We must find
        // characters from nodes that are not descendants or ancestors
        // of nodes for sequences to avoid. We can be sure that none of
        // the ancestors or descendants of avoid-nodes are avoid-nodes.

        // Start by sorting according to the desired balancing scheme:
        this.leafNodes.sort(LangSeqTreeNode.LEAF_CMP.get(balancingScheme));

        let nodeToHit: LangSeqTreeNode = null;
        for (const leaf of this.leafNodes) {
            // Take the next leaf node (don't remove it!), and if none of
            // its parents are avoid-nodes, then, from the set of nodes
            // including the leaf node and all its parents (minus the root),
            // choose the node with the least actual/personal hit-count.
            const upstreamNodes: Array<LangSeqTreeNode> = leaf.andNonRootParents();
            for (let i = 0; i < upstreamNodes.length; i++) {
                const conflictSeq: LangSeq = avoid.find(avoidSeq => {
                    return avoidSeq.startsWith(upstreamNodes[i].sequence);
                });
                if (conflictSeq !== undefined) {
                    if (conflictSeq === upstreamNodes[i].sequence) {
                        // Cannot use anything on this upstream path because
                        // an avoid-node is directly inside it.
                        upstreamNodes.splice(0);
                    } else {
                        // Found a node on an upstream path of an avoid-node.
                        // Doesn't stop us from using what we've found so far.
                        upstreamNodes.splice(i);
                    }
                    break;
                }
            }
            if (upstreamNodes.length > 0) {
                // Found a non-conflicting upstream node.
                // Find the node with the lowest personal hit-count:
                upstreamNodes.sort(LangSeqTreeNode.PATH_CMP.get(balancingScheme));
                nodeToHit = upstreamNodes[0];
                break;
            }
        }
        if (nodeToHit === null) {
            // Should never reach here because there is a check in the
            // constructor checking for this invariant.
            throw new Error(`Invariants guaranteeing that a LangSeq can`
                + `always be shufled-in were not met.`
            );
        }
        return nodeToHit.chooseOnePair(balancingScheme);
    }

}
