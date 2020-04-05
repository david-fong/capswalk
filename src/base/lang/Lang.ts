import { Lang as LangTypeDefs } from "utils/TypeDefs";

import { LangSeqTreeNode, BalancingScheme } from "lang/LangSeqTreeNode";


/**
 * A language is a map from a collection of unique characters to
 * corresponding key-sequences. the key-sequences may be non-unique.
 * (try searching up "Chinese riddle where each syllable is pronounced
 * 'shi'"). A character may have more than one corresponding sequence,
 * representing alternate "spellings" (ways of typing it).
 *
 * In the use-case of this game, it is more helpful to think in the
 * reverse direction: As a map from typeable-key-sequences to sets of
 * corresponding unique characters (no character is mapped by multiple
 * key-sequences). This game does not require support for retrieving
 * the `Lang.Seq` corresponding to a `LangChar`.
 *
 * See the readme in [the implementations folder](./impl/readme.md)
 * for a guide on writing implementations of this class.
 */
export abstract class Lang extends LangTypeDefs {

    /**
     * The abstract, static object for this language.
     */
    public readonly static: Lang.ClassIf;

    /**
     * A "reverse" map from `LangSeq`s to `LangChar`s.
     */
    private readonly treeMap: LangSeqTreeNode<true>;

    /**
     * A list of leaf nodes in `treeMap` sorted in ascending order by
     * hit-count. Entries should never be removed or added. They will
     * always be sorted in ascending order of `tricklingHitCount`.
     */
    private readonly leafNodes: Array<LangSeqTreeNode>;

    public get numLeaves(): number { return this.leafNodes.length; }



    /**
     * _Does not call reset._
     *
     * @param name -
     * @param forwardDict - Weights are _relative_ values handled by
     *      {@link LangSeqTreeNode}, which requires the provided values
     *      to all be strictly positive values. They do not all need
     *      to sum to a specific value such as 100.
     */
    protected constructor(classIf: Lang.ClassIf, forwardDict: Lang.CharSeqPair.WeightedForwardMap) {
        super();
        this.static = classIf;
        this.treeMap = LangSeqTreeNode.CREATE_TREE_MAP(forwardDict);
        this.leafNodes = this.treeMap.getLeafNodes();
    }

    public reset(): void {
        this.treeMap.reset();
    }


    /**
     * @returns
     * A random `Lang.Char` in this `Lang` whose corresponding
     * `Lang.Seq` is not a prefix of any `Lang.Seq` in `avoid`, and vice
     * versa. They may share a common prefix as long as they are both
     * longer in length than the shared prefix, and they are not equal
     * to one another.
     *
     * This method is called to shuffle the `Lang.Char` / `Lang.Seq`
     * pair at some Tile `A`. `avoid` should contain the `LangSeq`s
     * from all Tiles reachable by a human Player occupying a Tile
     * `B` from which they can also reach `A`
     *
     * In order for this `Lang` to satisfy these constraints, it must
     * be true that the number of leaf nodes in this tree-structure must
     * `avoid` argument.
     *
     * In this implementation, a human Player can only reach a
     * Tile whose coord has an `infNorm` of `1` from
     * that of the Tile they are currently occupying. That is,
     * `avoid` contains `LangSeq`s from all Tiles with an `infNorm`
     * <= `2` from the Tile to shuffle (not including itself).
     * This means that here, the size of `avoid` is always bounded by
     * `(2*2 + 1)^2 - 1 == 24`. Using the English alphabet (26 typeable-
     * letters), this requirement is met by a hair.
     *
     * @param avoid
     * A collection of `Lang.Seq`s to avoid conflicts with when choosing
     * a `Lang.Char` to return.
     *
     * @param balancingScheme -
     */
    public getNonConflictingChar(
        avoid: ReadonlyArray<Lang.Seq>,
        balancingScheme: BalancingScheme,
    ): Lang.CharSeqPair {
        // Wording the spec closer to this implementation: We must find
        // characters from nodes that are not descendants or ancestors
        // of nodes for sequences to avoid. We can be sure that none of
        // the ancestors or descendants of avoid-nodes are avoid-nodes.

        // Start by sorting according to the desired balancing scheme:
        this.leafNodes.sort(LangSeqTreeNode.LEAF_CMP[balancingScheme]);

        let nodeToHit: LangSeqTreeNode | undefined = undefined;
        for (const leaf of this.leafNodes) {
            // Take the next leaf node (don't remove it!), and if none of
            // its parents are avoid-nodes, then, from the set of nodes
            // including the leaf node and all its parents (minus the root),
            // choose the node with the least actual/personal hit-count.
            const upstreamNodes: Array<LangSeqTreeNode> = leaf.andNonRootParents();
            for (let i = 0; i < upstreamNodes.length; i++) {
                const conflictSeq: Lang.Seq | undefined = avoid.find(avoidSeq => {
                    return avoidSeq.startsWith(upstreamNodes[i].sequence);
                });
                if (conflictSeq) {
                    if (conflictSeq === upstreamNodes[i].sequence) {
                        // Cannot use anything on this upstream path because
                        // an avoid-node is directly inside it.
                        upstreamNodes.splice(0);
                    } else {
                        // Found a node on an upstream path of an avoid-node.
                        // Doesn't stop us from using what we've found so far.
                        upstreamNodes.splice(i);
                    }
                    break;
                }
            }
            if (upstreamNodes.length) {
                // Found a non-conflicting upstream node.
                // Find the node with the lowest personal hit-count:
                upstreamNodes.sort(LangSeqTreeNode.PATH_CMP[balancingScheme]);
                nodeToHit = upstreamNodes[0];
                break;
            }
        }
        if (!nodeToHit) {
            // Should never reach here because there is a check in the
            // constructor checking for this invariant.
            throw new Error(`Invariants guaranteeing that a LangSeq can`
                + `always be shuffled-in were not met.`
            );
        }
        return nodeToHit.chooseOnePair(balancingScheme);
    }

    public simpleView(): object {
        return Object.assign(Object.create(null), {
            name: this.static.getName,
            // we need to jump through some hoops to get this
            // without passing it in as a constructor argument ':)
            desc: (this["constructor"] as object as Lang.ClassIf).getBlurb(),
            root: this.treeMap.simpleView(),
        });
    }

}



export namespace Lang {

    /**
     * Every constructor function (class literal) implementing the
     * `Lang` class must implement this interface. Ie. These will be
     * implemented as static methods.
     */
    export interface ClassIf {
        getName(): string;
        getBlurb(): string;
        getInstance(): Lang;
        /**
         *
         * This can be used, for example, for basic practical purposes like
         * changing all letters to lowercase for the English language, or for
         * more interesting things like mapping halves of the keyboard to a
         * binary-like value like the dots and dashes in morse, or zeros and
         * ones in binary. It could even be used for some crazy challenges like
         * remapping the alphabet by barrel-shifting it so that pressing "a"
         * produces "b", and "b" produces "c", and so on.
         *
         * The output should either equal the input (in cases that the input
         * is already relevant to the `Lang` at hand and is intended to be
         * taken as-is (ex. typing "a" produces / corresponds to "a" in
         * regular English), or in cases where the input is completely
         * irrelevant before and after remapping), or be a translation to
         * some character that is relevant to the `Lang` and hand, and that
         * matches against {@link SEQ_REGEXP}. This behaviour is mandated
         * by {@link OperatorPlayer#seqBufferAcceptKey}.
         *
         * @param input -
         * @returns
         */
        remapKey(input: string): string;
    };

    /**
     * An atomic unit in a written language that constitutes a single
     * character. It is completely unique in its language, and has a
     * single corresponding sequence (string) typeable on a keyboard.
     */
    export type Char = LangTypeDefs.Char;

    /**
     * A sequence of characters each matching {@link SEQ_REGEXP}
     * that represent the intermediate interface between an Operator
     * and a `LangChar`. The immediate interface is through the `Lang`
     * implementation's {@link Lang#remapKey} method.
     */
    export type Seq = LangTypeDefs.Seq;
    export namespace Seq {
        /**
         * The choice of this pattern is not out of necessity, but following
         * the mindset of spec designers when they mark something as reserved:
         * For the language implementations I have in mind, I don't see the
         * need to include characters other than these.
         *
         * Characters that must never be unmarked as reserved (state reason):
         * (currently none. update as needed)
         */
        export const REGEXP = new RegExp("^[a-zA-Z\-.]+$");
    }

    /**
     * A key-value pair containing a `LangChar` and its corresponding
     * `LangSeq`.
     */
    export type CharSeqPair = LangTypeDefs.CharSeqPair;
    export namespace CharSeqPair {
        /**
         * A map from written characters to their corresponding typeable
         * keyboard sequence and relative spawn weight.
         *
         * Shape that must be passed in to the static tree producer. The
         * `Record` type enforces the invariant that {@link Lang.Char}s are
         * unique in a {@link Lang}. "CSP" is short for {@link Lang.CharSeqPair}.
         */
        export type WeightedForwardMap = Record<Lang.Char, Readonly<{seq: Lang.Seq, weight: number,}>>;
    }



    export namespace Modules {

        export const NAMES = Object.freeze(<const>[
            "English", "Japanese",
        ]);

        /**
         * All `Lang` implementations should put their module _file_
         * names here so that they can be dynamically loaded later.
         *
         * TODO: use this in the privileged settings.
         *
         * \@ dynamic imports:
         * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import
         * https://github.com/tc39/proposal-dynamic-import/#import
         * https://v8.dev/features/dynamic-import
         *
         * Note: Since this language feature isn't yet implemented in any browsers,
         * let's just import everything. It's not fancy, but it works.
         */
        export const PATHS = NAMES.reduce<Record<string, string>>((prev, filename) => {
            // This test is somewhat arbitrary.
            if (!(/[A-Z][a-zA-Z]*/.test(filename))) {
                throw new Error(`The filename ${filename} does not match PascalCase.`);
            }
            prev[filename] = `src/lang/impl/${filename}`; // file extension is not required (I think).
            return prev;
        }, {}) as Record<typeof NAMES[number], string>;
    }

}
