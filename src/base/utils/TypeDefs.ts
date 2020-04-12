

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
}
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

    export const Names = Object.freeze(<const>{
        ENGLISH__LOWERCASE: "English Lowercase (QWERTY)",
        ENGLISH__MIXEDCASE: "English Mixed-Case (QWERTY)",
        JAPANESE__HIRAGANA: "Japanese Hiragana",
        JAPANESE__KATAKANA: "Japanese Katakana",
        KOREAN__DUBEOLSIK: "Korean Dubeolsik (두벌식 키보드)",
        KOREAN__SEBEOLSIK: "Korean Sebeolsik (세벌식 최종 키보드)",
    });
    export namespace Names {
        export type Key = keyof typeof Names;
        export type Value = typeof Names[keyof typeof Names];
    }

    // Common remapping functions.
    export const __RemapTemplates = Object.freeze(<const>{
        IDENTITY: (input: string): string => input,
        TO_LOWER: (input: string): string => input.toLowerCase(),
    });
    __RemapTemplates as Readonly<Record<string, {(input: string): string}>>

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
    : Readonly<Record<Names.Value, {(input: string): string}>>
    = Object.freeze(<const>{
        [Names.ENGLISH__LOWERCASE]: __RemapTemplates.TO_LOWER,
        [Names.ENGLISH__MIXEDCASE]: __RemapTemplates.IDENTITY,
        [Names.JAPANESE__HIRAGANA]: __RemapTemplates.TO_LOWER,
        [Names.JAPANESE__KATAKANA]: __RemapTemplates.TO_LOWER,
        [Names.KOREAN__DUBEOLSIK]:  __RemapTemplates.IDENTITY,
        [Names.KOREAN__SEBEOLSIK]:  __RemapTemplates.IDENTITY,
    });
}
Object.freeze(Lang.prototype);
