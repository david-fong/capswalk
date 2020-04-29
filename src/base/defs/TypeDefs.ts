
export namespace SkErrors {
    // TODO.impl use these?
    export const NEVER = <const>"Never happens. See comment in source.";
}


export class Player<S> { }
export namespace Player {

    /**
     * @enum
     * Each implementation of the {@link ArtificialPlayer} class must
     * have an entry here.
     */
    export type Family = keyof typeof Family;
    export const Family = Object.freeze(<const>{
        HUMAN:  "HUMAN",
        CHASER: "CHASER",
    });
    Family as { [ key in Family ]: key };

    /**
     * See the main documentation in game/player/Player.
     */
    export type Id = number;

    export namespace Id {
        /**
         * See the main documentation in game/player/Player.
         */
        export const NULL = undefined;
        export type Nullable = Player.Id | typeof Player.Id.NULL;
    }

    /**
     * See the main documentation in game/player/Player.
     */
    export type Health = number;

    export type MoveType = keyof typeof MoveType;
    export const MoveType = Object.freeze(<const>{
        NORMAL: "NORMAL",
        BOOST:  "BOOST",
    });
    MoveType as { [ key in MoveType ]: key };
}
Object.freeze(Player);
Object.freeze(Player.prototype);


export class Lang {}
export namespace Lang {
    /**
     * See the main documentation in game/lang/Lang
     */
    export type Char = string;
    /**
     * See the main documentation in game/lang/Lang
     */
    export type Seq = string;
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
     * See the main documentation in game/lang/Lang
     */
    export type CharSeqPair = Readonly<{
        char: Lang.Char,
        seq:  Lang.Seq,
    }>;
    export namespace CharSeqPair {
        /**
         * Used to clear the {@link CharSeqPair} in a {@link Tile} during
         * a {@link Game} reset before grid-wide shuffling, or before a
         * single shuffling operation on the {@link Tile} to be shuffled.
         */
        export const NULL = Object.freeze(<const>{
            char: "",
            seq:  "",
        });
    }

    /**
     * Ways of choosing {@link LangCharSeqPair} to balance the frequency
     * of the selection of a result based on the results of all previous
     * selections.
     */
    export const enum BalancingScheme {
        SEQ     = "SEQ",
        CHAR    = "CHAR",
        WEIGHT  = "WEIGHT",
    }

    /***
     * There are three string for each language!
     * - The object key string is for use in the ts/js code, hence the casing.
     * - The display name is for display purposes. Special characters are OK.
     * - The id name is a shorter string for web-storage keys and a URL query.
     */
    export const Names = Object.freeze(<const>{
        ENGLISH__LOWERCASE: {
            id:         "engl-low",
            filename:   "English",
            display:    "English Lowercase (QWERTY)",
        },
        ENGLISH__MIXEDCASE: {
            id:         "engl-mix",
            filename:   "English",
            display:    "English Mixed-Case (QWERTY)",
        },
        JAPANESE__HIRAGANA: {
            id:         "japn-hir",
            filename:   "Japanese",
            display:    "Japanese Hiragana",
        },
        JAPANESE__KATAKANA: {
            id:         "japn-kat",
            filename:   "Japanese",
            display:    "Japanese Katakana",
        },
        KOREAN__DUBEOLSIK: {
            id:         "kore-dub",
            filename:   "Korean",
            display:    "Korean Dubeolsik (두벌식 키보드)",
        },
        KOREAN__SEBEOLSIK: {
            id:         "kore-sub",
            filename:   "Korean",
            display:    "Korean Sebeolsik (세벌식 최종 키보드)",
        },
        KOREAN__ROMANIZATION: {
            id:         "kore-rom",
            filename:   "Korean",
            display:    "Korean Revised Romanization",
        },
    });
    Names as Record<string, { display: string, id: string, }>;
    export namespace Names {
        export type Key = keyof typeof Names;
        export type Value = typeof Names[keyof typeof Names];
    }

    // Common remapping functions.
    export const __RemapTemplates = Object.freeze(<const>{
        IDENTITY: (input: string): string => input,
        TO_LOWER: (input: string): string => input.toLowerCase(),
    });
    __RemapTemplates as Readonly<Record<string, {(input: string): string}>>;

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
    export const RemappingFunctions
    : Readonly<Record<Names.Value["id"], {(input: string): string}>>
    = Object.freeze(<const>{
        [ Names.ENGLISH__LOWERCASE.id ]: __RemapTemplates.TO_LOWER,
        [ Names.ENGLISH__MIXEDCASE.id ]: __RemapTemplates.IDENTITY,
        [ Names.JAPANESE__HIRAGANA.id ]: __RemapTemplates.TO_LOWER,
        [ Names.JAPANESE__KATAKANA.id ]: __RemapTemplates.TO_LOWER,
        [ Names.KOREAN__DUBEOLSIK.id  ]: __RemapTemplates.IDENTITY,
        [ Names.KOREAN__SEBEOLSIK.id  ]: __RemapTemplates.IDENTITY,
        [ Names.KOREAN__ROMANIZATION.id]:__RemapTemplates.TO_LOWER,
    });
}
Object.freeze(Lang);
Object.freeze(Lang.prototype);
