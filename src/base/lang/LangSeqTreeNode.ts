import { JsUtils } from "defs/JsUtils";
import { Lang as _Lang } from "defs/TypeDefs";
import type { Lang } from "./Lang";
type LangSorter<T> = (a: T, b: T) => number;

/** */
export namespace LangSeqTree {

	/** */
	export class Node {

		declare public readonly parent: Node | undefined;
		declare public readonly seq: Lang.Seq;
		declare protected readonly children: TU.RoArr<Node>;
		readonly #characters: TU.RoArr<WeightedLangChar> = [];
		/**
		 * Equals this node's own weighted hit count plus all its ancestors'
		 * weighted hit counts.
		 */
		protected carryHits: number = 0.0;
		public get ownHits(): number {
			return this.carryHits - (this.parent?.carryHits ?? 0);
		}

		/** */
		protected constructor(
			parent: Node | undefined,
			seq: Lang.Seq = "",
			characters: TU.RoArr<WeightedLangChar>,
		) {
			Object.defineProperty(this, "parent",   { enumerable: true, value: parent });
			Object.defineProperty(this, "seq",      { enumerable: true, value: seq });
			Object.defineProperty(this, "children", { enumerable: true, value: [] });
			this.#characters = Object.freeze(characters);
			Object.seal(this); //🧊
		}

		public reset(): void {
			// Reset hit-counters on the way down.
			this.carryHits = 0.0;
			for (const child of this.children) child.reset();

			// On the way up, seed hit-counters (which get inherited downwards).
			for (const char of this.#characters) {
				char.reset();
				this.incrHits(char, Math.random() * _Lang.CHAR_HIT_COUNT_SEED_CEILING);
			}
		}

		public getLeaves(): TU.RoArr<Node> {
			const leafNodes: Array<Node> = [];
			this._rGetLeaves(leafNodes);
			return leafNodes.freeze();
		}
		protected _rGetLeaves(leafNodes: Array<Node>): void {
			if (this.children.length) {
				for (const child of this.children) child._rGetLeaves(leafNodes);
			} else {
				leafNodes.push(this as Node);
			}
		}

		/**
		 * @description
		 * Incrementing the hit-count makes this node less likely to be
		 * used for a shuffle-in. Shuffle-in option searching is easy to
		 * taking the viewpoint of leaf-nodes, so this implementation is
		 * geared toward indicating hit-count through leaf-nodes, hence
		 * the bubble-down of hit-count incrementation.
		 *
		 * @returns
		 * A character / sequence pair from this node that has been
		 * selected the least according to the specified scheme.
		 */
		public chooseOnePair(): Lang.CharSeqPair {
			let wgtChar = this.#characters[0]!;
			for (const wc of this.#characters) {
				if (wc.hits < wgtChar.hits) {
					wgtChar = wc;
				}
			}
			const pair: Lang.CharSeqPair = {
				char: wgtChar.char,
				seq:  this.seq,
			};
			this.incrHits(wgtChar);
			return pair;
		}
		private incrHits(wCharToHit: WeightedLangChar, numTimes: number = 1): void {
			wCharToHit._incrementNumHits();
			this._rIncrHits(wCharToHit.weightInv * numTimes);
		}
		private _rIncrHits(weightInv: number): void {
			this.carryHits += weightInv;
			for (const child of this.children) child._rIncrHits(weightInv);
		}

		/**
		 * @returns The root node of a new tree map.
		 */
		public static CREATE_TREE_MAP(
			forwardDict: Lang.WeightedForwardMap,
			weightScaling: Lang.WeightExaggeration,
		): readonly Node[] {
			const scaleWeight = LangSeqTree.GET_SCALE_WEIGHT_FUNC(weightScaling, forwardDict);

			// Reverse the map:
			const reverseDict = new Map<Lang.Seq, WeightedLangChar[]>();
			Object.entries(forwardDict).freeze().forEach(([char, {seq, weight}]) => {
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

			const roots: Node[] = [];
			let parent: Node | undefined = undefined; // a DFS cursor.
			for (const [seq, chars] of
				// Sorting alphabetically enables DFS-ordered tree construction.
				Array.from(reverseDict).seal().sort(([seqA], [seqB]) => (seqA < seqB) ? -1 : 1).freeze()
			) /* no breaks */ {
				while (parent !== undefined && !seq.startsWith(parent.seq)) {
					parent = parent.parent;
				}
				const newNode: Node = new Node(parent, seq, chars);
				if (parent !== undefined) {
					(parent.children as Node[]).push(newNode);
				} else {
					roots.push(newNode);
				}
				parent = newNode;
			}
			return roots.freeze();
		}

		public static readonly LEAF_CMP: LangSorter<Node> = (a, b) => {
			return a.carryHits - b.carryHits;
		};
	}
	JsUtils.protoNoEnum(Node, "_rGetLeaves", "_rIncrHits");
	Object.freeze(Node);
	Object.freeze(Node.prototype);


	/** */
	export function GET_SCALE_WEIGHT_FUNC(
		weightScaling: Lang.WeightExaggeration,
		forwardDict: Lang.WeightedForwardMap,
	): (ogWeight: number) => number {
		if (weightScaling === 0) return () => 1;
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

	/**
	 * A weight is relative to weights of other unique characters in
	 * the contextual language. Characters with relatively higher
	 * weights will have relatively higher shuffle-in frequencies.
	 *
	 * Specifically, a character A with a weight N times that of some
	 * other character B will, on average, be returned N times more
	 * often by the `chooseOnePair` method than B.
	 */
	declare public readonly weightInv: number;

	/** This value is weighted according to `weightInv`. */
	public hits: number = 0.0;

	public constructor(
		public readonly char: Lang.Char,
		weight: number,
	) {
		this.char = char;
		Object.defineProperty(this, "weightInv", { enumerable: true, value: 1.0 / weight });
		// The above choice of a numerator is not behaviourally significant.
		// All that is required is that all single-mappings in a `Lang` use
		// a consistent value.
		Object.seal(this); //🧊
	}
	public reset(): void {
		this.hits = 0.0;
	}
	public _incrementNumHits(): void {
		this.hits += this.weightInv;
	}
};
Object.freeze(WeightedLangChar);
Object.freeze(WeightedLangChar.prototype);