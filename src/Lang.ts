
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
    readonly dict: Map<LangSeq, Set<LangChar>>;

    public constructor() {
        this.dict = new Map();
        Object.freeze(this.dict);
    }


}

/**
 * 
 */
class SeqTreeMap {
    constructor() {

    }
}

