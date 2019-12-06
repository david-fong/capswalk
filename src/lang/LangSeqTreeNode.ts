import { Lang } from "src/lang/Lang";


/**
 * Ways of choosing {@link LangCharSeqPair} to balance the frequency
 * of the selection of a result based on the results of all previous
 * selections.
 */
export enum BalancingScheme {
    SEQ, CHAR, WEIGHT,
}

type BalanceSchemeSorterMap<T> = ReadonlyMap<BalancingScheme, (a: T, b: T) => number>;

/**
 * Shape that must be passed in to the static tree producer. The
 * `Record` type enforces the invariant that {@link Lang.Char}s are
 * unique in a {@link Lang}. "CSP" is short for {@link Lang.CharSeqPair}
 */
export type WeightedCspForwardMap = Record<Lang.Char, Readonly<{seq: Lang.Seq, weight: number,}>>;



/**
 * No `LangSeqTreeNode`s mapped in the `children` field have an empty
 * `characters` collection (with the exception of the root node). The
 * root node should have a falsy parent, and the `empty string` as its
 * `sequence` field, with a correspondingly empty `characters` collection.
 * 
 * All non-root nodes have a `sequence` that is prefixed by their parent's
 * `sequence`, and a non-empty `characters` collection.
 * 
 * The enclosing {@link Lang} object has no concept of `LangChar` weights.
 * All it has is the interfaces provided by the hit-count getter methods.
 */
export class LangSeqTreeNode {

    public readonly sequence:   Lang.Seq;
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
        const reverseDict: Map<Lang.Seq, Array<WeightedLangChar>> = new Map();
        for (const char in forwardDict) {
            const seq: Lang.Seq = forwardDict[char].seq;
            const weightedChar = new WeightedLangChar(
                char, forwardDict[char].weight,
            );
            const charArray = reverseDict.get(seq);
            if (charArray) {
                charArray.push(weightedChar);
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
            .forEach((mapping) => {
                rootNode.addCharMapping(...mapping);
            }, this);
        rootNode.finalize();
        return rootNode;
    }

    private constructor(
        parent: LangSeqTreeNode | null,
        sequence: Lang.Seq,
        characters: ReadonlyArray<WeightedLangChar>,
    ) {
        this.sequence   = sequence;
        this.parent     = parent;
        this.characters = characters;
        this.children   = [];
    }

    private finalize(): void {
        if (!(this.parent)) {
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
        this.children.forEach((child) => child.finalize());
    }

    public reset(): void {
        this.hitCount = 0;
        this.weightedHitCount = 0.000;
        this.characters.forEach((char) => char.reset());
        this.children.forEach((child) => child.reset());
    }

    /**
     * 
     * @param seq The typable sequence corrensponding to entries of `chars`.
     * @param chars A collection of unique characters in a written language.
     */
    private addCharMapping(seq: Lang.Seq, chars: Array<WeightedLangChar>): void {
        if (!(Lang.Seq.REGEXP.test(seq))) {
            throw new Error(`Mapping sequence must match ${Lang.Seq.REGEXP}.`);
        } else if (chars.length === 0) {
            throw new Error("Must not make mapping without written characters.");
        }
        let node: LangSeqTreeNode = this; {
            let childNode: LangSeqTreeNode | undefined = this;
            while (childNode !== undefined) {
                node = childNode;
                childNode = node.children.find((child) => seq.startsWith(child.sequence));
            }
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
    public chooseOnePair(balancingScheme: BalancingScheme): Lang.CharSeqPair {
        if (!(this.parent)) {
            throw new Error("Should never hit on the root.");
        }
        const weightedChar = this.characters.slice(0)
            .sort(WeightedLangChar.CMP.get(balancingScheme))
            .shift() as WeightedLangChar;
        const pair: Lang.CharSeqPair = {
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
        this.children.forEach((child) => child.recursiveIncrementNumHits(weightInv));
    }

    /**
     * Do not call this on a root node.
     *
     * @returns How many hits were made on this node since the last reset.
     */
    protected get personalHitCount(): number {
        return this.hitCount - (this.parent as LangSeqTreeNode).hitCount;
    }

    protected get averageCharHitCount(): number {
        return (
            this.characters.reduce<number>((prev, curr) => prev + curr.hitCount, 0)
            / this.characters.length
        );
    }

    /**
     * Do not call this on a root node.
     *
     * @returns How many hits were made on this node since the last reset.
     */
    protected get personalWeightedHitCount(): number {
        return this.weightedHitCount - (this.parent as LangSeqTreeNode).weightedHitCount;
    }

    public andNonRootParents(): Array<LangSeqTreeNode> {
        const upstreamNodes: Array<LangSeqTreeNode> = [];

        let node: LangSeqTreeNode = this;
        while (node.parent) {
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
            this.children.forEach((child) => child.recursiveGetLeafNodes(leafNodes));
        }
    }



    /**
     * @param a - 
     * @param b - 
     * @returns - 
     */
    public static readonly LEAF_CMP: BalanceSchemeSorterMap<LangSeqTreeNode> = new Map([
        [ BalancingScheme.SEQ,   ((a, b) => a.hitCount - b.hitCount), ],
        [ BalancingScheme.CHAR,  ((a, b) => a.hitCount - b.hitCount), ],
        [ BalancingScheme.WEIGHT,((a, b) => a.weightedHitCount - b.weightedHitCount), ],
    ]);

    /**
     * @param a - 
     * @param b - 
     * @returns - 
     */
    public static readonly PATH_CMP: BalanceSchemeSorterMap<LangSeqTreeNode> = new Map([
        [ BalancingScheme.SEQ,   ((a, b) => a.personalHitCount - b.personalHitCount), ],
        [ BalancingScheme.CHAR,  ((a, b) => a.averageCharHitCount - b.averageCharHitCount), ],
        [ BalancingScheme.WEIGHT,((a, b) => a.personalWeightedHitCount - b.personalWeightedHitCount), ],
    ]);

}



/**
 * Has no concept of an associated typable sequence. Used to associate
 * a written character to a relative frequency of occurance in samples
 * of writing, and to keep a counter for how many times this character
 * has been shuffled-in in the current game session.
 * 
 * Not exported.
 */
class WeightedLangChar {

    public readonly char: Lang.Char;

    /**
     * A weight is relative to weights of other unique characters in
     * the contextual language. A character with a higher weight, when
     * using the {@link BalancingScheme#WEIGHT} scheme, will have a
     * higher shuffle-in priority than characters with a lower weight.
     * 
     * Specifically, using the {@link BalancingScheme#WEIGHT} scheme,
     * a character `cA` with a weight `N` times that of another `cB`
     * will, on average, be returned `N` times more often by the
     * {@link LangSeqTreeNode#chooseOnePair} method than `cB`.
     * 
     * This is implemented using counters that last for the lifetime
     * of one game, and increment for a chosen character by the inverse
     * of its weight every time it is chosen. Choosing the character
     * with the lowest such counter at a given time will produce the
     * desired effect:
     * 
     * If there are three characters mapped with weights `cA: 1`, `cB:
     * 2`, `cC: 3`, and share no prefixing substrings and we pretend
     * that there are never any sequences to avoid when shuffling in
     * characters, then the results of consecutive calls should produce
     * something like: `A(0), B(0), C(0), A(1/3), B(1/2), A(2/3),
     * (repeat forever)`, where the bracketed values are their weighted
     * hit-counts before they were returned, since the last reset.
     */
    public readonly weightInv: number;
    public hitCount: number;
    public weightedHitCount: number;

    public constructor(
        char: Lang.Char,
        weight: number,
    ) {
        if (weight <= 0) {
            throw new RangeError(`All weights must be positive, but we`
                + ` were passed the value ${weight} for the character`
                + ` ${char}.`);
        }
        this.char = char;
        this.weightInv = 1.000 / weight;
    }

    public reset(): void {
        this.hitCount = 0;
        this.weightedHitCount = 0.000;
    }

    /**
     * @param a - 
     * @param b - 
     * @returns - 
     */
    public static readonly CMP: BalanceSchemeSorterMap<WeightedLangChar> = new Map([
        [ BalancingScheme.SEQ,   (a, b) => a.hitCount - b.hitCount, ], // design choice.
        [ BalancingScheme.CHAR,  (a, b) => a.hitCount - b.hitCount, ],
        [ BalancingScheme.WEIGHT,(a, b) => a.weightedHitCount - b.weightedHitCount, ],
    ]);
};
