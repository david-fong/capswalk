
/**
 * An atomic unit in a written language that constitutes a single
 * character.
 */
type LangChar = string;

/**
 * Should be typable on a generic keyboard, and should not contain any
 * white-space-type characters.
 */
type LangSeq = string;



/**
 * A [Lang](uage) is a map from a collection of unique characters to
 * corresponding key-sequences. the key-sequences may be non-unique.
 * (try searching up "Chinese riddle where each syllable is pronounced
 * 'shi'").
 * 
 * In the use-case of this game, it is more helpful to think in the
 * reverse direction: As a map from typable-key-sequences to sets of
 * corresponding unique characters (no character is mapped by multiple
 * key-sequences).
 */
abstract class Lang {

    readonly name: string;
    readonly dict: LangSeqTreeNode;

    public constructor() {
        this.dict = new LangSeqTreeNode;
        // TODO: read from file. JSON? plain text? typescript?
        for (;;) {
            this.addCharMapping(null, null);
        }
        this.dict.finalize();
    }

    /**
     * 
     * @param char 
     * @param seq 
     */
    private addCharMapping(char: LangChar, seq: LangSeq): void {
        let node: LangSeqTreeNode;
        let seqScrub: number;
        for (
            node = this.dict, seqScrub = 0;
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
     * 
     */
    public getNonConflictingChar(avoid: Set<LangSeq>): LangChar {
        // TODO
        return null;
    }

}





/**
 * Any [LangSeqTreeNode]s mapped in the [childNodes] field have either
 * a non-empty [characters] collection, or a non-empty [childNodes]
 * collection, or both.
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
     * Returns a collection of all [LangChar]s corresponding to [seq].
     * Throws an error if [seq] is not in the calling [Lang].
     * 
     * @param seq A sequence that must be in the calling [Lang].
     */
    public get(seq: LangSeq): Set<LangChar> {
        console.assert(seq.length > 0);
        let node: LangSeqTreeNode;
        let seqScrub: number;
        for (
            node = this, seqScrub = 0;
            seqScrub < seq.length;
            node = node.childNodes.get(seq[seqScrub]), seqScrub++
        ) {
            if (!(node.childNodes.has(seq[seqScrub]))) {
                throw new Error(`seq ${seq} is not in the calling language.`);
            }
        }
        return node.characters;
    }
}

