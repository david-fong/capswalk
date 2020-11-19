import { JsUtils } from "defs/JsUtils";
import { Lang as _Lang } from "defs/TypeDefs";
import type { Lang } from "./Lang";


type LangSorter<T> = (a: T, b: T) => number;

/**
 */
export namespace LangSeqTree {

	/**
	 */
	export class ParentNode {

		public readonly seq = "" as Lang.Seq;
		protected readonly children: TU.RoArr<ChildNode>;
		/**
		 * Equals this node's own weighted hit count plus all its ancestors'
		 * weighted hit counts.
		 */
		protected branchHits: number;

		public constructor() {
			this.children = [];
			JsUtils.propNoWrite(this as ParentNode, ["children"]);
		}

		public reset(): void {
			for (const child of this.children) child.reset();
			this.branchHits = 0.000;
		}

		protected _finalize(): void {
			Object.freeze(this.children);
			for (const child of this.children) (child as ParentNode)._finalize();
			// The above cast to ParentNode tells to the TypeScript
			// compiler that the override has protected access to us.
		}

		public getLeaves(): Array<ChildNode> {
			const leafNodes: Array<ChildNode> = [];
			this._rGetLeaves(leafNodes);
			return leafNodes;
		}
		protected _rGetLeaves(leafNodes: Array<ChildNode>): void {
			if (this.children.length) {
				for (const child of this.children) child._rGetLeaves(leafNodes);
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
			const scaleWeight = LangSeqTree.GET_SCALE_WEIGHT_FUNC(weightScaling, forwardDict);

			// Reverse the map:
			const reverseDict: Map<Lang.Seq, Array<WeightedLangChar>> = new Map();
			Object.entries(forwardDict).forEach(([char, {seq,weight}]) => {
				const weightedChar = new WeightedLangChar(
					char, scaleWeight(weight),
				);
				const chars = reverseDict.get(seq);
				if (chars !== undefined) {
					// The entry was already made:
					chars.push(weightedChar);
				} else {
					reverseDict.set(seq, [weightedChar]);
				}
			});

			// Add mappings in ascending order of sequence length:
			// (this is so that no merging of branches needs to be done)
			const rootNode = new ParentNode();
			JsUtils.propNoWrite(rootNode as ParentNode, ["children"]);
			let cursor: ChildNode | ParentNode = rootNode;
			for (const [seq, chars] of Array.from(reverseDict).sort(([seqA], [seqB]) => (seqA < seqB) ? -1 : 1)) {
				while (!seq.startsWith(cursor.seq)) {
					cursor = (cursor as ChildNode).parent;
				}
				const newChild: ChildNode = new ChildNode(cursor, seq, chars);
				((cursor as ParentNode).children as ChildNode[]).push(newChild);
				cursor = newChild;
			}
			rootNode._finalize();
			return rootNode;
		}

		public static readonly LEAF_CMP: LangSorter<ChildNode> = (a, b) => {
			return a.branchHits - b.branchHits;
		};
	}
	JsUtils.protoNoEnum(ParentNode, ["_finalize", "_rGetLeaves"]);
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

		public readonly seq: Lang.Seq;
		public readonly parent: ChildNode | ParentNode;
		readonly #characters: TU.RoArr<WeightedLangChar>;

		public constructor(
			parent:     ParentNode,
			sequence:   Lang.Seq,
			characters: TU.RoArr<WeightedLangChar>,
		) {
			super();
			this.seq    = sequence;
			this.#characters = characters;
			this. parent     = parent;
			JsUtils.propNoWrite(this as ChildNode, ["seq", "parent"]);
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
				this.incrHits(char, Math.random() * _Lang.CHAR_HIT_COUNT_SEED_CEILING);
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
				seq:  this.seq,
			};
			this.incrHits(weightedChar);
			return pair;
		}
		private incrHits(wCharToHit: WeightedLangChar, numTimes: number = 1): void {
			wCharToHit._incrementNumHits();
			this._rIncrHits(wCharToHit.weightInv * numTimes);
		}
		private _rIncrHits(weightInv: number): void {
			this.branchHits += weightInv;
			for (const child of this.children) child._rIncrHits(weightInv);
		}

		public get ownHits(): number {
			return this.branchHits
			- (this.parent as ChildNode).branchHits;
			// The above cast is only to allow us to access a
			// protected property from the parent in this subclass.
		}

		public andNonRootParents(): Array<ChildNode> {
			const upstreamNodes: Array<ChildNode> = [];
			for (
				let node: ParentNode | ChildNode = this;
				node instanceof ChildNode;
				node = node.parent
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
				seq: this.seq,
				chars: (chars.length === 1) ? chars[0] : chars,
				kids: this.children.map((child) => child.simpleView()),
			});
		}

		public static readonly PATH_CMP: LangSorter<ChildNode> = (a, b) => {
			return a.ownHits - b.ownHits;
		};
	}
	JsUtils.protoNoEnum(ChildNode, ["_finalize", "_rIncrHits"]);
	Object.freeze(ChildNode);
	Object.freeze(ChildNode.prototype);

	export function GET_SCALE_WEIGHT_FUNC(
		weightScaling: Lang.WeightExaggeration,
		forwardDict: Lang.CharSeqPair.WeightedForwardMap,
	): (ogWeight: number) => number {
		if (weightScaling === 0) return (ogWgt: number) => 1;
		if (weightScaling === 1) return (ogWgt: number) => ogWgt;
		const values = Object.values(forwardDict);
		const averageWeight = values.reduce((sum, next) => sum += next.weight, 0) / values.length;
		return (originalWeight: number) => Math.pow(originalWeight / averageWeight, weightScaling);
	};
	Object.freeze(GET_SCALE_WEIGHT_FUNC);
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

	public static readonly CMP: LangSorter<WeightedLangChar> = (a, b) => {
		return a.weightedHitCount - b.weightedHitCount;
	};
};
Object.freeze(WeightedLangChar);
Object.freeze(WeightedLangChar.prototype);