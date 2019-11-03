
/**
 * No `LangSeqTreeNode`s mapped in the `childNodes` field have an empty
 * `characters` collection. The root node should have a `null` parent,
 * and the empty string as its `sequence`, with a correspondingly empty
 * `characters` collection.
 * 
 * All non-root nodes have a `sequence` that is prefixed by their parent's
 * `sequence`, and a non-empty `characters` collection.
 * 
 * Implementation note: to create an instance:
 * 1. create a root node
 * 1. add mappings from `LangChar`s to `LangSeq`s to the root
 * 1. call `::finalize` on the root to create a flattened version of the tree
 * 1. call reset on the flattened tree's root
 */
class LangSeqTreeNode {

    public readonly sequence:   LangSeq;
    public readonly characters: Array<LangChar>;
    private _parent:        LangSeqTreeNode; // `null` for root node.
    private _childNodes:    Array<LangSeqTreeNode>; // empty for leaf nodes.
    private _numHits: number;

    /**
     * 
     */
    static CREATE_TREE_MAP(forwardDict: Record<LangChar, LangSeq>): LangSeqTreeNode {
        const rootNode: LangSeqTreeNode = new LangSeqTreeNode(null, "");
        for (const langChar in forwardDict) {
            rootNode.addCharMapping(langChar, forwardDict[langChar]);
        }
        rootNode.flatten();
        rootNode.reset();
        return rootNode;
    }

    private constructor(parent: LangSeqTreeNode, sequence: LangSeq) {
        this.sequence       = sequence;
        this._parent        = parent;
        this.characters     = [];
        this._childNodes    = [];
    }

    private flatten(): void {
        const descendants: Array<LangSeqTreeNode> = this.getFirstDescendantsWithChars();
        this._childNodes = [];
        descendants.forEach(child => {
            child._parent = this;
            this._childNodes.push(child);
            child.flatten();
        }, this);
        Object.freeze(this.characters);
        Object.freeze(this._childNodes);
    }

    public reset(): void {
        this._numHits = 0;
        this._childNodes.forEach(child => child.reset());
    }



    /**
     * 
     * @param char A unique character in a written language.
     * @param seq The typable sequence corrensponding to `char`.
     */
    private addCharMapping(char: LangChar, seq: LangSeq): void {
        if (seq.length === 0) {
            throw new Error("Mapping sequence must not be the empty string.")
        }
        let node: LangSeqTreeNode;
        let seqScrub: number;
        for ( // Iterate down the tree map:
            node = this, seqScrub = 0;
            seqScrub < seq.length;
            node = node._childNodes.get(seq[seqScrub++])
        ) {
            if (!(node._childNodes.has(seq[seqScrub]))) {
                node._childNodes.set(
                    seq[seqScrub],
                    new LangSeqTreeNode(node, node.sequence + seq[seqScrub])
                );
            }
        }
        if (node.characters.some(existingChar => existingChar === char)) {
            throw new Error(`A mapping was already made between ${char} and ${seq}.`);
        }
        node.characters.push(char);
    }

    /**
     * Returns a collection of all [LangChar]s corresponding to [seq].
     * Throws an error if [seq] is not in the calling [Lang].
     * 
     * @param seq A sequence that must be in the calling [Lang].
     */
    public get(seq: LangSeq): LangChar {
        if (seq.length === 0) {
            throw new Error("Search sequence must not be the empty string.")
        }
        let node: LangSeqTreeNode;
        let seqScrub: number;
        for ( // Iterate down the tree map:
            node = this, seqScrub = 0;
            seqScrub < seq.length;
            node = node._childNodes.get(seq[seqScrub++])
        ) {
            if (!(node._childNodes.has(seq[seqScrub]))) {
                throw new Error(`The sequence ${seq} is not in the calling language.`);
            }
        }
        if (node.characters.length === 0) {
            throw new RangeError(`No mapping is associated with the sequence \"${seq}\".`);
        }
        return node.characters[Math.trunc(Math.random() * node.characters.length)];
    }



    /**
     * Helper for `::flatten` method.
     */
    private getFirstDescendantsWithChars(): Array<LangSeqTreeNode> {
        const bfsQueue: Array<LangSeqTreeNode> = [this, ];
        const retVal:   Array<LangSeqTreeNode> = [];
        do {
            const node: LangSeqTreeNode = bfsQueue.shift();
            for (const child of node._childNodes) {
                if (child.characters.length === 0) {
                    console.assert(
                        child._childNodes.length > 0,
                        "Leaf nodes should contain mappings.",
                    );
                    bfsQueue.push(child);
                } else {
                    retVal.push(child);
                }
            }
        } while (bfsQueue.length > 0);

        return retVal;
    }



    public incrementNumHits(): void {
        this._numHits++;
        // if (this.parent !== null) {
        //     this.parent.incrementNumHits();
        // }
    }

    public get parent(): LangSeqTreeNode {
        return this._parent;
    }

    public get numHits(): number {
        return this._numHits;
    }

}
