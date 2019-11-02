
/**
 * Any `LangSeqTreeNode`s mapped in the `childNodes` field have either
 * a non-empty `characters` collection, or a non-empty `childNodes`
 * collection, or both. All leaf nodes have a non-empty `characters`
 * collection.
 */
class LangSeqTreeNode {

    readonly characters: Set<LangChar>;
    readonly childNodes: Map<string, LangSeqTreeNode>;

    constructor() {
        this.characters = new Set();
        this.childNodes = new Map();
    }

    public finalize(): void {
        Object.freeze(this);
        Object.freeze(this.characters);
        Object.freeze(this.childNodes);
        this.childNodes.forEach(child => child.finalize);
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
                node.childNodes.set(seq[seqScrub], new LangSeqTreeNode());
            }
        }
        node.characters.add(char);
    }

    /**
     * Returns a collection of all [LangChar]s corresponding to [seq].
     * Throws an error if [seq] is not in the calling [Lang].
     * 
     * @param seq A sequence that must be in the calling [Lang].
     */
    public get(seq: LangSeq): Set<LangChar> {
        if (seq.length <= 0) {
            throw new Error("Search sequence must not be the empty string.")
        }
        let node: LangSeqTreeNode;
        let seqScrub: number;
        for (
            node = this, seqScrub = 0;
            seqScrub < seq.length;
            node = node.childNodes.get(seq[seqScrub]), seqScrub++
        ) {
            if (!(node.childNodes.has(seq[seqScrub]))) {
                throw new Error(`The sequence ${seq} is not in the calling language.`);
            }
        }
        return node.characters;
    }

}
