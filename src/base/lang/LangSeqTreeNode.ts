import { JsUtils } from "defs/JsUtils";
import { Lang as _Lang } from "defs/TypeDefs";
import type { Lang } from "./Lang";


type LangSorter<T> = (a: T, b: T) => number;

/**
 *
 */
export namespace LangSeqTree {
    /**
     *
     */
    export class ParentNode {

        protected readonly children: TU.RoArr<ChildNode>;
        /**
         * Equals this node's own weighted hit count plus all its ancestors'
         * weighted hit counts.
         */
        protected inheritingWeightedHitCount: number;

        public constructor() {
            this.children = [];
            JsUtils.propNoWrite(this as ParentNode, ["children"]);
        }

        public reset(): void {
            for (const child of this.children) child.reset();
            this.inheritingWeightedHitCount = 0.000;
        }

        protected _finalize(): void {
            Object.freeze(this.children);
            for (const child of this.children) (child as ParentNode)._finalize();
            // The above cast to ParentNode tells to the TypeScript
            // compiler that the override has protected access to us.
        }

        /**
         *
         * @param seq The typeable sequence corresponding to entries of `chars`.
         * @param chars A collection of unique characters in a written language.
         */
        private _addCharMapping(seq: Lang.Seq, chars: TU.RoArr<WeightedLangChar>): void {
            if (DEF.DevAssert && !(_Lang.Seq.REGEXP.test(seq))) {
                // If this errs, and the offending character is one that can
                // be easily entered on a generic keyboard, don't be afraid
                // to just add it to the regexp.
                throw new RangeError(`Mapping-sequence \"${seq}\" did not match the`
                + ` required regular expression \"${_Lang.Seq.REGEXP.source}\".`
                );
            }
            if (DEF.DevAssert && chars.length === 0) {
                // Must not make a mapping without written characters.
                throw new RangeError("never");
            }
            let node: ParentNode = this; {
                let childNode: ParentNode | undefined;
                while ((childNode = node.children.find((child) => seq.startsWith(child.sequence))) !== undefined) {
                    node = childNode;
                }
            }
            if (DEF.DevAssert && (node as ChildNode).sequence === seq) {
                // This should never happen.
                throw new Error(`Mappings for all written-characters with a common`
                + `corresponding typeable-sequence should be registered together,`
                + `but an existing mapping for the sequence \"${seq}\" was found.`
                );
            }
            (node.children as ChildNode[]).push(new ChildNode(node, seq, chars));
        }

        public getLeafNodes(): Array<ChildNode> {
            const leafNodes: Array<ChildNode> = [];
            this._recursiveGetLeafNodes(leafNodes);
            return leafNodes;
        }
        protected _recursiveGetLeafNodes(leafNodes: Array<ChildNode>): void {
            if (this.children.length) {
                for (const child of this.children) child._recursiveGetLeafNodes(leafNodes);
            } else {
                leafNodes.push(this as ParentNode as ChildNode);
            }
        }

        public simpleView(): object {
            return this.children;
        }

        /**
         * @returns The root node of a new tree map.
         */
        public static CREATE_TREE_MAP(
            forwardDict: Lang.CharSeqPair.WeightedForwardMap,
            weightScaling: Lang.WeightExaggeration,
        ): LangSeqTree.ParentNode {
            const averageWeight = Object.values(forwardDict).reduce((sum, next) => sum += next.weight, 0);
            const scaleWeight = (function(): (ogWeight: number) => number {
                return (weightScaling === 0) ? (originalWeight: number) => 1
                    :  (weightScaling === 1) ? (originalWeight: number) => originalWeight
                    : (originalWeight: number) => Math.pow(originalWeight / averageWeight, weightScaling);
            })();
            Object.freeze(scaleWeight);

            // Reverse the map:
            const reverseDict: Map<Lang.Seq, Array<WeightedLangChar>> = new Map();
            Object.entries(forwardDict).forEach(([char, {seq,weight}]) => {
                const weightedChar = new WeightedLangChar(
                    char, scaleWeight(weight),
                );
                const charArray = reverseDict.get(seq);
                if (charArray !== undefined) {
                    // The entry was already made:
                    charArray.push(weightedChar);
                } else {
                    reverseDict.set(seq, [weightedChar]);
                }
            });

            // Add mappings in ascending order of sequence length:
            // (this is so that no merging of branches needs to be done)
            const rootNode = new ParentNode();
            for (const args of Array
                .from(reverseDict)
                .sort((mappingA, mappingB) => mappingA[0].length - mappingB[0].length)
            ) {
                rootNode._addCharMapping(...args);
            }
            rootNode._finalize();
            return rootNode;
        }

        public static readonly LEAF_CMP: LangSorter<ChildNode> = (a, b) => {
            return a.inheritingWeightedHitCount - b.inheritingWeightedHitCount;
        };
    }
    JsUtils.protoNoEnum(ParentNode, ["_finalize", "_recursiveGetLeafNodes"]);
    Object.freeze(ParentNode);
    Object.freeze(ParentNode.prototype);


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
    export class ChildNode extends ParentNode {

        public readonly sequence: Lang.Seq;
        readonly #parent:     ChildNode | ParentNode;
        readonly #characters: TU.RoArr<WeightedLangChar>;


        public constructor(
            parent:     ParentNode,
            sequence:   Lang.Seq,
            characters: TU.RoArr<WeightedLangChar>,
        ) {
            super();
            this.sequence    = sequence;
            this.#characters = characters;
            this.#parent     = parent;
            JsUtils.propNoWrite(this as ChildNode, ["sequence"]);
        }

        /**
         * @override
         */
        protected _finalize(): void {
            Object.freeze(this.#characters);
            super._finalize();
        }

        public reset(): void {
            super.reset();
            // Order matters! The below work must be done after `super.reset`
            // so that `inheritingWeightedHitCount` does not get erroneously
            // reset to zero after starting to inherit seeding hits.
            for (const char of this.#characters) {
                char.reset();
                this.incrementNumHits(char, Math.random() * _Lang.CHAR_HIT_COUNT_SEED_CEILING);
            }
        }

        /**
         * #### How it works:
         *
         * Incrementing the hit-count makes this node less likely to be
         * used for a shuffle-in. Shuffle-in option searching is easy to
         * taking the viewpoint of leaf-nodes, so this implementation is
         * geared toward indicating hit-count through leaf-nodes, hence
         * the bubble-down of hit-count incrementation.
         *
         * @returns A character / sequence pair from this node that has
         *      been selected the least according to the specified scheme.
         */
        public chooseOnePair(): Lang.CharSeqPair {
            let weightedChar: WeightedLangChar = this.#characters[0];
            for (const otherWeightedChar of this.#characters) {
                if (otherWeightedChar.weightedHitCount < weightedChar.weightedHitCount) {
                    weightedChar = otherWeightedChar;
                }
            }
            const pair: Lang.CharSeqPair = {
                char: weightedChar.char,
                seq:  this.sequence,
            };
            this.incrementNumHits(weightedChar);
            return pair;
        }
        private incrementNumHits(wCharToHit: WeightedLangChar, numTimes: number = 1): void {
            wCharToHit._incrementNumHits();
            this._recursiveIncrementNumHits(wCharToHit.weightInv * numTimes);
        }
        private _recursiveIncrementNumHits(weightInv: number): void {
            this.inheritingWeightedHitCount += weightInv;
            for (const child of this.children) child._recursiveIncrementNumHits(weightInv);
        }

        public get personalWeightedHitCount(): number {
            return this.inheritingWeightedHitCount
            - (this.#parent as ChildNode).inheritingWeightedHitCount;
            // The above cast is only to allow us to access a
            // protected property from the parent in this subclass.
        }

        public andNonRootParents(): Array<ChildNode> {
            const upstreamNodes: Array<ChildNode> = [];
            for (
                let node: ParentNode | ChildNode = this;
                node instanceof ChildNode;
                node = node.#parent
            ) {
                upstreamNodes.push(node);
            }
            return upstreamNodes;
        }

        /**
         * For debugging purposes.
         */
        public simpleView(): object {
            let chars = this.#characters.map((char) => char.simpleView());
            return Object.assign(Object.create(null), {
                seq: this.sequence,
                chars: (chars.length === 1) ? chars[0] : chars,
                kids: this.children.map((child) => child.simpleView()),
            });
        }

        public static readonly PATH_CMP: LangSorter<ChildNode> = (a, b) => {
            return a.personalWeightedHitCount - b.personalWeightedHitCount;
        };
    }
    JsUtils.protoNoEnum(ChildNode, ["_finalize", "_recursiveIncrementNumHits"]);
    Object.freeze(ChildNode);
    Object.freeze(ChildNode.prototype);
}
Object.freeze(LangSeqTree);



/**
 * Has no concept of an associated typeable sequence. Used to associate
 * a written character to a relative frequency of occurrence in samples
 * of writing, and to keep a counter for how many times this character
 * has been shuffled-in in the current game session.
 *
 * Not exported.
 */
class WeightedLangChar {

    public readonly char: Lang.Char;

    /**
     * A weight is relative to weights of other unique characters in
     * the contextual language. Characters with relatively higher
     * weights will have relatively higher shuffle-in frequencies.
     *
     * Specifically, a character A with a weight N times that of some
     * other character B will, on average, be returned N times more
     * often by the `chooseOnePair` method than B.
     *
     * This is implemented using counters that last for the lifetime
     * of one game, that increment for a chosen character by the inverse
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
    public weightedHitCount: number;

    public constructor(
        char: Lang.Char,
        weight: number,
    ) {
        if (DEF.DevAssert && weight <= 0) {
            throw new RangeError(`All weights must be positive, but we`
            + ` were passed the value \"${weight}\" for the character`
            + ` \"${char}\".`);
        }
        this.char = char;
        this.weightInv = 1.000 / weight;
        // The above choice of a numerator is not behaviourally significant.
        // All that is required is that all single-mappings in a `Lang` use
        // a consistent value.
    }

    public reset(): void {
        this.weightedHitCount = 0.000;
    }

    public _incrementNumHits(): void {
        this.weightedHitCount += this.weightInv;
    }

    public simpleView(): object {
        return Object.assign(Object.create(null), {
            char: this.char,
        });
    }

    /**
     * @param a -
     * @param b -
     * @returns -
     */
    public static readonly CMP: LangSorter<WeightedLangChar> = (a, b) => {
        return a.weightedHitCount - b.weightedHitCount;
    };
};
Object.freeze(WeightedLangChar);
Object.freeze(WeightedLangChar.prototype);