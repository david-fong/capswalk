
/**
 * No `LangSeqTreeNode`s mapped in the `children` field have an empty
 * `characters` collection (with the exception of the root node). The
 * root node should have a `null` parent, and the empty string as its
 * `sequence` field, with a correspondingly empty `characters` collection.
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
    public readonly parent:     LangSeqTreeNode; // `null` for root node.
    public readonly children:   Array<LangSeqTreeNode>; // empty for leaf nodes.
    private _numHits: number;

    /**
     * 
     */
    static CREATE_TREE_MAP(forwardDict: Record<LangChar, LangSeq>): LangSeqTreeNode {
        // Reverse the map:
        const reverseDict: Map<LangSeq, Array<LangChar>> = new Map();
        for (const char in forwardDict) {
            if (reverseDict.has(forwardDict[char])) {
                reverseDict.get(forwardDict[char]).push(char);
            } else {
                reverseDict.set(forwardDict[char], [char,]);
            }
        }
        const reverseSortedDict: Array<[LangSeq, Array<LangChar>,]> = Array
            .from(reverseDict)
            .sort((mappingA, mappingB) => mappingA[0].length - mappingB[0].length);

        // Add mappings in ascending order of sequence length:
        // (this is so that no merging of branches needs to be done)
        const rootNode: LangSeqTreeNode = new LangSeqTreeNode(null, "", []);
        for (const mapping of reverseSortedDict) {
            rootNode.addCharMapping(...mapping);
        }
        rootNode.finalize();
        rootNode.reset();
        return rootNode;
    }

    private constructor(
        parent: LangSeqTreeNode,
        sequence: LangSeq,
        characters: Array<LangChar>,
    ) {
        this.sequence   = sequence;
        this.parent     = parent;
        this.characters = characters;
        this.children   = [];
    }

    private finalize(): void {
        Object.freeze(this.characters);
        Object.freeze(this.children);
        this.children.forEach(child => child.finalize());
    }

    public reset(): void {
        this._numHits = 0;
        this.children.forEach(child => child.reset());
    }



    /**
     * 
     * @param seq The typable sequence corrensponding to entries of `chars`.
     * @param chars A collection of unique characters in a written language.
     */
    private addCharMapping(seq: LangSeq, chars: Array<LangChar>): void {
        if (seq.length === 0) {
            throw new Error("Mapping sequence must not be the empty string.")
        } else if (chars.length === 0) {
            throw new Error("Must not make mapping without written characters.")
        }
        let node: LangSeqTreeNode;
        let childNode: LangSeqTreeNode = this;
        while (childNode !== undefined) {
            node = childNode;
            childNode = node.children.find(child => seq.startsWith(child.sequence))
        }
        if (node.sequence === seq) {
            throw new Error(`A mapping was already made from characters to \"${seq}\".`);
        }
        node.children.push(new LangSeqTreeNode(node, seq, chars));
    }



    public incrementNumHits(): void {
        this._numHits++;
        // if (this.parent !== null) {
        //     this.parent.incrementNumHits();
        // }
    }

    public get numHits(): number {
        return this._numHits;
    }

}
