import { LangSeqTreeNode } from "src/LangSeqTreeNode";
import { Defs } from "src/Defs";

/**
 * An atomic unit in a written language that constitutes a single
 * character.
 */
export type LangChar = string;

/**
 * Should be typable on a QWERTY keyboard, and should not contain any
 * white-space-type characters.
 */
export type LangSeq = string;

/**
 * A key-value pair containing a `LangChar` and its corresponding
 * `LangSeq`.
 */
export class LangCharSeqPair {
    public constructor(
        public readonly char: LangChar,
        public readonly seq:  LangSeq,
    ) {}
}



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
export class Lang {

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

    protected constructor(name: string, forwardDict: Record<LangChar, LangSeq>) {
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
     * @returns a random `LangChar` in this Lang whose corresponding
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
     * In order for this Lang to satisfy these constraints, it must
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
     *          when choosing a `LangChar` to return.
     */
    public getNonConflictingChar(avoid: ReadonlyArray<LangSeq>): LangCharSeqPair {
        // Wording the spec closer to this implementation: We must find
        // characters from nodes that are not descendants or ancestors
        // of nodes for sequences to avoid. We can be sure that none of
        // the ancestors or descendants of avoid-nodes are avoid-nodes.

        // Take the first leaf node (don't remove it!), and if none of
        // its parents are avoid-nodes, then, from the set of nodes
        // including the leaf node and all its parents (minus the root),
        // choose the node with the least actual/personal hit-count.
        let nodeToHit: LangSeqTreeNode = null;
        for (const leaf of this.leafNodes) {
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
                upstreamNodes.sort((nodeA, nodeB) => {
                    return nodeA.personalHitCount - nodeB.personalHitCount;
                });
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

        // TODO: change this to a method that returns a random character
        // from `node` and implicitly increments its hit-count.
        const chosenPair: LangCharSeqPair = null;
        nodeToHit.incrementNumHits();
        this.leafNodes.sort((leafA, leafB) => {
            return leafA.tricklingHitCount - leafB.tricklingHitCount;
        });
        return chosenPair;
    }

}
