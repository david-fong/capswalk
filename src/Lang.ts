
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
 * A `Lang`(uage) is a map from a collection of unique characters to
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

    /**
     * A reverse map from `LangSeq`s to `LangChar`s. In order for this
     * `Lang` to satisfy the constraints of the problem statement on
     * `LangChar`-shuffling described in the spec for the method
     * `::getNonConflictingChar`, it must be true that the number of
     * leaf nodes in this tree-structure must be greater than the
     * maximum possible number of `LangSeq`s in `::getNonConflictingChar`'s
     * `avoid` argument.
     */
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
     * Return a random `LangChar` in this `Lang` whose corresponding
     * `LangSeq` is not a prefix of any `LangSeq` in `avoid`, and vice
     * versa. They may share a common prefix as long as they are longer
     * in length than the shared prefix, and they are not equal to one
     * another.
     * 
     * This method is called to shuffle the `LangChar` / `LangSeq` pair
     * at some `Tile` `A`. `avoid` should contain the `LangSeq`s from
     * all `Tile`s reachable by a human `Player` occupying a `Tile` `B`
     * from which they can also reach `A`.
     * 
     * In this implementation, a human `Player` can only reach a `Tile`
     * whose `pos` has an `infNorm` of `1` from that of the `Tile` they
     * are currently occupying. That is, `avoid` contains `LangSeq`s
     * from all `Tile`s with an `infNorm` <= `2` from the `Tile` to
     * shuffle (not including itself). This means that here, the size of
     * `avoid` is always bounded by `(2*2 + 1)^2 - 1 == 24`.
     * 
     * @param avoid A collection of `LangSeq`s to avoid conflicts with
     *          when choosing a `LangChar` to return.
     */
    public getNonConflictingChar(avoid: Array<LangSeq>): LangChar {
        // TODO
        return null;
    }

}





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

