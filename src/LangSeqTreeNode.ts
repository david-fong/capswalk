
/**
 * Any `LangSeqTreeNode`s mapped in the `childNodes` field have either
 * a non-empty `characters` collection, or a non-empty `childNodes`
 * collection, or both. All leaf nodes have a non-empty `characters`
 * collection. The root node must have and empty `characters` collection
 * since it represents the sequence for the empty string.
 */
class LangSeqTreeNode {

    public readonly characters: Array<LangChar>;
    public readonly childNodes: Map<string, LangSeqTreeNode>;
    public readonly parent: LangSeqTreeNode; // `null` if root node.
    private _numHits: number;

    public constructor(parent: LangSeqTreeNode) {
        this.parent = parent;
        this.characters = [];
        this.childNodes = new Map();
        this.reset();
    }

    public reset(): void {
        this._numHits = 0;
        this.childNodes.forEach(child => child.reset());
    }

    public finalize(): void {
        Object.freeze(this.characters);
        Object.freeze(this.childNodes);
        this.childNodes.forEach(child => child.finalize());
    }

    /**
     * 
     * @param char A unique character in a written language.
     * @param seq The typable sequence corrensponding to `char`.
     */
    public addCharMapping(char: LangChar, seq: LangSeq): void {
        let node: LangSeqTreeNode;
        let seqScrub: number;
        for (
            node = this, seqScrub = 0;
            seqScrub < seq.length;
            node = node.childNodes.get(seq[seqScrub++])
        ) {
            if (!(node.childNodes.has(seq[seqScrub]))) {
                node.childNodes.set(
                    seq[seqScrub],
                    new LangSeqTreeNode(this)
                );
            }
        }
        if (node.characters.some(existingChar => existingChar === char)) {
            throw new Error(`A mapping was already made of ${char} to ${seq}.`);
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
        if (seq.length <= 0) {
            throw new Error("Search sequence must not be the empty string.")
        }
        let node: LangSeqTreeNode;
        let seqScrub: number;
        for (
            node = this, seqScrub = 0;
            seqScrub < seq.length;
            node = node.childNodes.get(seq[seqScrub++])
        ) {
            if (!(node.childNodes.has(seq[seqScrub]))) {
                throw new Error(`The sequence ${seq} is not in the calling language.`);
            }
        }
        if (node.characters.length === 0) {
            throw new RangeError(`No mapping is associated with the sequence \"${seq}\".`);
        }
        return node.characters[Math.trunc(Math.random() * node.characters.length)];
    }

    public incrementNumHits(): void {
        this._numHits++;
        if (this.parent !== null) {
            this.parent.incrementNumHits();
        }
    }

    public get numHits(): number {
        return this._numHits;
    }

}
