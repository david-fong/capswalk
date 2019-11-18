import { LangChar, LangSeq, LangCharSeqPair } from "src/Lang";



/**
 * Ways of choosing {@link LangCharSeqPair} to balance the frequency
 * of the selection of a result based on the results of all previous
 * selections.
 */
export enum BalancingScheme {
    SEQ, CHAR, WEIGHT,
}

/**
 * Shape that must be passed in to the static tree producer. The
 * `Record` type enforces the invariant that {@link LangChar}s are
 * unique in a {@link Lang}. "CSP" is short for {@link LangCharSeqPair}
 */
export type WeightedCspForwardMap = Record<LangChar, {seq: LangSeq, weight: number,}>;



/**
 * No `LangSeqTreeNode`s mapped in the `children` field have an empty
 * `characters` collection (with the exception of the root node). The
 * root node should have a `null` parent, and the empty string as its
 * `sequence` field, with a correspondingly empty `characters` collection.
 * 
 * All non-root nodes have a `sequence` that is prefixed by their parent's
 * `sequence`, and a non-empty `characters` collection.
 * 
 * The enclosing {@link Lang} object has no concept of `LangChar` weights.
 * All it has is the interfaces provided by the hit-count getter methods.
 * TODO: make those getters accomodate char weights.
 */
export class LangSeqTreeNode {

    public readonly sequence:   LangSeq;
    public readonly characters: ReadonlyArray<WeightedLangChar>; // Frozen.

    public readonly parent:     LangSeqTreeNode | null; // `null` for root node.
    public readonly children:   Array<LangSeqTreeNode>; // Empty for leaf nodes. Frozen.

    private hitCount: number;
    private weightedHitCount: number;



    /**
     * _Does not call reset._
     * 
     * @param forwardDict - 
     * @returns The root node of a new tree map.
     */
    public static CREATE_TREE_MAP(forwardDict: WeightedCspForwardMap): LangSeqTreeNode {
        // Reverse the map:
        const reverseDict: Map<LangSeq, Array<WeightedLangChar>> = new Map();
        for (const char in forwardDict) {
            const seq: LangSeq = forwardDict[char].seq;
            const weightedChar = new WeightedLangChar(
                char, forwardDict[char].weight,
            );
            if (reverseDict.has(seq)) {
                reverseDict.get(seq).push(weightedChar);
            } else {
                reverseDict.set(seq, [weightedChar,]);
            }
        }
        // Add mappings in ascending order of sequence length:
        // (this is so that no merging of branches needs to be done)
        const rootNode: LangSeqTreeNode = new LangSeqTreeNode(null, "", []);
        Array.from(reverseDict)
          //.sort((mappingA, mappingB) => mappingA[0].localeCompare(mappingB[0]))
            .sort((mappingA, mappingB) => mappingA[0].length - mappingB[0].length)
            .forEach(mapping => {
                rootNode.addCharMapping(...mapping);
            }, this);
        rootNode.finalize();
        // reset will be called automatically by `Lang`.
        // rootNode.reset();
        return rootNode;
    }

    private constructor(
        parent: LangSeqTreeNode,
        sequence: LangSeq,
        characters: ReadonlyArray<WeightedLangChar>,
    ) {
        this.sequence   = sequence;
        this.parent     = parent;
        this.characters = characters;
        this.children   = [];
    }

    private finalize(): void {
        if (this.parent === null) {
            if (this.sequence.length > 0) {
                throw new Error("Root node's sequence must be the empty string.");
            }
        } else {
            if (!(this.sequence.startsWith(this.parent.sequence))) {
                throw new Error("Child node's sequence must start with that of its parent.");
            }
        }
        Object.freeze(this.characters);
        Object.freeze(this.children);
        this.children.forEach(child => child.finalize());
    }

    public reset(): void {
        this.hitCount = 0;
        this.weightedHitCount = 0;
        this.characters.forEach(char => char.reset());
        this.children.forEach(child => child.reset());
    }

    /**
     * 
     * @param seq The typable sequence corrensponding to entries of `chars`.
     * @param chars A collection of unique characters in a written language.
     */
    private addCharMapping(seq: LangSeq, chars: Array<WeightedLangChar>): void {
        if (seq.length === 0) {
            throw new Error("Mapping sequence must not be the empty string.");
        } else if (chars.length === 0) {
            throw new Error("Must not make mapping without written characters.");
        }
        let node: LangSeqTreeNode;
        let childNode: LangSeqTreeNode = this;
        while (childNode !== undefined) {
            node = childNode;
            childNode = node.children.find(child => seq.startsWith(child.sequence));
        }
        if (node.sequence === seq) {
            throw new Error(`Mappings for all written-characters with a common`
                + `corresponding typable-sequence should be registered together,`
                + `but an existing mapping for the sequence \"${seq}\" was found.`
            );
        }
        node.children.push(new LangSeqTreeNode(node, seq, chars));
    }



    /**
     * Incrementing the hit-count makes this node less likely to be
     * used for a shuffle-in. Shuffle-in option searching is easy to
     * taking the viewpoint of leaf-nodes, so this implementation is
     * geared toward indicating hit-count through leaf-nodes, hence
     * the bubble-down of hit-count incrementation.
     * 
     * @param balancingScheme - 
     * @returns A character / sequence pair from this node that has
     *      been selected the least according to the specified scheme.
     */
    public chooseOnePair(balancingScheme: BalancingScheme): LangCharSeqPair {
        if (this.parent === null) {
            throw new Error("Should never hit on the root.");
        }
        const weightedChar: WeightedLangChar = this.characters.slice(0)
            .sort(WeightedLangChar.CMP.get(balancingScheme))
            .shift();
        const pair: LangCharSeqPair = {
            char: weightedChar.char,
            seq:  this.sequence,
        };
        weightedChar.hitCount += 1;
        weightedChar.weightedHitCount += weightedChar.weightInv;
        this.recursiveIncrementNumHits(weightedChar.weightInv);
        return pair;
    }
    private recursiveIncrementNumHits(weightInv: number): void {
        this.hitCount += 1;
        this.weightedHitCount += weightInv;
        this.children.forEach(child => child.recursiveIncrementNumHits(weightInv));
    }

    /**
     * Do not call this on a root node.
     *
     * @returns How many hits were made on this node since the last reset.
     */
    public get personalHitCount(): number {
        return this.hitCount - this.parent.hitCount;
    }

    /**
     * Do not call this on a root node.
     *
     * @returns How many hits were made on this node since the last reset.
     */
    public get personalWeightedHitCount(): number {
        return this.weightedHitCount - this.parent.weightedHitCount;
    }

    public andNonRootParents(): Array<LangSeqTreeNode> {
        const upstreamNodes: Array<LangSeqTreeNode> = [];

        let node: LangSeqTreeNode = this;
        while (node.parent !== null) {
            upstreamNodes.push(node);
            node = node.parent;
        }
        return upstreamNodes;
    }

    public getLeafNodes(): Array<LangSeqTreeNode> {
        const leafNodes: Array<LangSeqTreeNode> = [];
        this.recursiveGetLeafNodes(leafNodes);
        return leafNodes;
    }
    private recursiveGetLeafNodes(leafNodes: Array<LangSeqTreeNode>): void {
        if (this.children.length === 0) {
            leafNodes.push(this);
        } else {
            this.children.forEach(child => child.recursiveGetLeafNodes(leafNodes));
        }
    }



    /**
     * @param a - 
     * @param b - 
     * @returns - 
     */
    public static readonly LEAF_CMP:
        ReadonlyMap<BalancingScheme, {(a: LangSeqTreeNode, b: LangSeqTreeNode): number}>
        = new Map([
            [BalancingScheme.SEQ,   ((a, b) => a.hitCount - b.hitCount),],
            [BalancingScheme.CHAR,  ((a, b) => a.hitCount - b.hitCount),],
            [BalancingScheme.WEIGHT,((a, b) => a.weightedHitCount - b.weightedHitCount),],
        ]
    );

    /**
     * @param a - 
     * @param b - 
     * @returns - 
     */
    public static readonly PATH_CMP:
        ReadonlyMap<BalancingScheme, {(a: LangSeqTreeNode, b: LangSeqTreeNode): number}>
        = new Map([
            [BalancingScheme.SEQ,   ((a, b) => a.personalHitCount - b.personalHitCount),],
            [BalancingScheme.CHAR,  ((a, b) => a.personalHitCount - b.personalHitCount),], // TODO: use min character hitcount
            [BalancingScheme.WEIGHT,((a, b) => a.personalWeightedHitCount - b.personalWeightedHitCount),],
        ]
    );

}



class WeightedLangChar {

    public readonly char: LangChar;
    public readonly weightInv: number;
    public hitCount: number;
    public weightedHitCount: number;

    public constructor(
        char: LangChar,
        weight: number,
    ) {
        this.char = char;
        this.weightInv = 1 / weight;
    }

    public reset(): void {
        this.hitCount = 0;
        this.weightedHitCount = 0;
    }

    /**
     * @param a - 
     * @param b - 
     * @returns - 
     */
    public static readonly CMP:
        ReadonlyMap<BalancingScheme, (nodeA: WeightedLangChar, nodeB: WeightedLangChar) => number>
        = new Map([
            [BalancingScheme.SEQ,   (a, b) => a.hitCount - b.hitCount,], // design choice.
            [BalancingScheme.CHAR,  (a, b) => a.hitCount - b.hitCount,],
            [BalancingScheme.WEIGHT,(a, b) => a.weightedHitCount - b.weightedHitCount,],
        ]
    );
};
