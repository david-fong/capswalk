import { Lang } from "lang/Lang";


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
export class LangSeqTreeNode<ROOT extends boolean = false> {

    public readonly sequence:   ROOT extends true ? "" : Lang.Seq;
    public readonly characters: ReadonlyArray<WeightedLangChar>; // Frozen.
    public readonly parent:     ROOT extends true ? undefined : LangSeqTreeNode;
    public readonly children:   Array<LangSeqTreeNode>; // Frozen.

    private hitCount: number;
    private weightedHitCount: number;



    /**
     * _Does not call reset._
     * 
     * @param forwardDict - 
     * @returns The root node of a new tree map.
     */
    public static CREATE_TREE_MAP(forwardDict: Lang.CharSeqPair.WeightedForwardMap): LangSeqTreeNode<true> {
        // Reverse the map:
        const reverseDict: Map<Lang.Seq, Array<WeightedLangChar>> = new Map();
        for (const char in forwardDict) {
            const seq = forwardDict[char].seq;
            const weightedChar = new WeightedLangChar(
                char, forwardDict[char].weight,
            );
            const charArray = reverseDict.get(seq);
            if (charArray) {
                // The entry was already made:
                charArray.push(weightedChar);
            } else {
                reverseDict.set(seq, [weightedChar,]);
            }
        }
        // Add mappings in ascending order of sequence length:
        // (this is so that no merging of branches needs to be done)
        const rootNode = new LangSeqTreeNode.Root();
        Array.from(reverseDict)
          //.sort((mappingA, mappingB) => mappingA[0].localeCompare(mappingB[0]))
            .sort((mappingA, mappingB) => mappingA[0].length - mappingB[0].length)
            .forEach((mapping) => {
                rootNode.addCharMapping(...mapping);
            });
        rootNode.finalize();
        return rootNode;
    }

    protected constructor(
        parent:     LangSeqTreeNode<ROOT>["parent"],
        sequence:   LangSeqTreeNode<ROOT>["sequence"],
        characters: ROOT extends true ? readonly [] : ReadonlyArray<WeightedLangChar>,
    ) {
        this.sequence   = sequence;
        this.characters = characters;
        this.parent     = parent;
        this.children   = [];
    }

    private finalize(): void {
        this.validateConstruction();
        Object.freeze(this.characters);
        Object.freeze(this.children);
        this.children.forEach((child) => child.finalize());
    }

    protected validateConstruction(): void | never {
        if (!(this.sequence.startsWith(this.parent!.sequence))) {
            throw new Error("Child node's sequence must start with that of its parent.");
        }
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
    protected addCharMapping(seq: Lang.Seq, chars: ReadonlyArray<WeightedLangChar>): void {
        if (!(Lang.Seq.REGEXP.test(seq))) {
            throw new RangeError(`Mapping-sequence \"${seq}\" did not match the`
                + ` required regular expression \"${Lang.Seq.REGEXP.source}\".`);
        } else if (chars.length === 0) {
            throw new Error("Must not make mapping without written characters.");
        }
        let node: LangSeqTreeNode<any> = this; {
            let childNode: LangSeqTreeNode<any> | undefined = this;
            while (childNode) {
                node = childNode;
                childNode = childNode.children.find((child) => seq.startsWith(child.sequence));
            }
        }
        if (node.sequence === seq) {
            // This should never happen.
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
        const weightedChar = this.characters.slice(0)
            .sort(WeightedLangChar.CMP.get(balancingScheme))
            .shift()!;
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
        return this.hitCount - (this.parent!).hitCount;
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
        return this.weightedHitCount - (this.parent!).weightedHitCount;
    }

    public andNonRootParents(): Array<LangSeqTreeNode> {
        const upstreamNodes: Array<LangSeqTreeNode> = [];

        let node = this as LangSeqTreeNode;
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
        if (this.children.length) {
            this.children.forEach((child) => {
                child.recursiveGetLeafNodes(leafNodes);
            });
        } else {
            leafNodes.push(this as LangSeqTreeNode);
        }
    }



    public simpleView(): object {
        let chars = this.characters.map((char) => char.simpleView());
        return {
            seq: this.sequence,
            chars: (chars.length === 1) ? chars[0] : chars,
            hits: this.personalHitCount,
            kids: this.children.map((child) => child.simpleView()),
            __proto__: undefined,
        };
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



export namespace LangSeqTreeNode {
    export class Root extends LangSeqTreeNode<true> {
        public constructor() {
            super(undefined, "", []);
        }
        public validateConstruction(): void {
            // nothing.
        }
        public chooseOnePair(balancingScheme: BalancingScheme): never {
            throw new TypeError("Must never hit on the root.");
        }
        protected get personalHitCount(): number {
            throw new TypeError("Must never hit on the root.");
        }
        protected get personalWeightedHitCount(): never {
            throw new TypeError("Must never hit on the root.");
        }
        public andNonRootParents(): never {
            throw new TypeError();
        }
        public simpleView(): object {
            return this.children.map((child) => child.simpleView());
        }
    }
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
                + ` were passed the value \"${weight}\" for the character`
                + ` \"${char}\".`);
        }
        this.char = char;
        this.weightInv = 1.000 / weight;
        // The above choice of a numerator is not behaviourally significant.
        // All that is required is that all single-mappings in a `Lang` use
        // a consistant value.
    }

    public reset(): void {
        this.hitCount = 0;
        this.weightedHitCount = 0.000;
    }

    public simpleView(): object {
        return {
            char: this.char,
            hits: this.hitCount,
        };
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
