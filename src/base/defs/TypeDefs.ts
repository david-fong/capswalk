
export namespace SkErrors {
    // TODO.impl use these?
    export const NEVER = <const>"Never happens. See comment in source.";
}


/**
 * Copied from TypeScript official docs.
 *
 * @param derivedCtor -
 * @param baseCtors -
 */
export function applyMixins(derivedCtor: any, baseCtors: any[]): void {
    baseCtors.forEach((baseCtor) => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
            Object.defineProperty(derivedCtor.prototype, name,
                Object.getOwnPropertyDescriptor(baseCtor.prototype, name)!
            );
        });
    });
}

/**
 *
 * @param obj -
 */
export function deepFreeze(obj: any): void {
    for (const key of Object.getOwnPropertyNames(obj)) {
        const val = obj[key];
        if (typeof val === "object") {
            deepFreeze(val);
        }
    }
    return Object.freeze(obj);
}


/**
 *
 */
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


/**
 *
 */
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
        export const REGEXP = new RegExp("^[a-zA-Z0-9!@#$%^&*()\-_=+;:'\"\\|,.<>/?]+$");
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
    export const _RemapTemplates = Object.freeze(<const>{
        IDENTITY: (input: string): string => input,
        TO_LOWER: (input: string): string => input.toLowerCase(),
    });
    _RemapTemplates as Readonly<Record<string, {(input: string): string}>>;

    /**
     *
     */
    export const FrontendDescs = Object.freeze([
       <const>{
        id: "engl-low",
        module: "English", export: "Lowercase", numLeaves: 26,
        remapFunc: _RemapTemplates.TO_LOWER,
        displayName: "English Lowercase (QWERTY)",
        blurb: "",
    }, <const>{
        id: "engl-mix",
        module: "English", export: "MixedCase", numLeaves: 52,
        remapFunc: _RemapTemplates.IDENTITY,
        displayName: "English Mixed-Case (QWERTY)",
        blurb: "",
    }, <const>{
        id: "japn-hir",
        module: "Japanese", export: "Hiragana", numLeaves: 71,
        remapFunc: _RemapTemplates.TO_LOWER,
        displayName: "Japanese Hiragana",
        blurb: "",
    }, <const>{
        id: "japn-kat",
        module: "Japanese", export: "Katakana", numLeaves: 70,
        remapFunc: _RemapTemplates.TO_LOWER,
        displayName: "Japanese Katakana",
        blurb: "",
    }, <const>{
        id: "kore-dub",
        module: "Korean", export: "Dubeolsik", numLeaves: 9177,
        remapFunc: _RemapTemplates.IDENTITY,
        displayName: "Korean Dubeolsik (두벌식 키보드)",
        blurb: "The most common keyboard layout, and South Korea's only Hangul"
        + " standard since 1969. Consonants are on the left, and vowels on"
        + " the right.",
    }, <const>{
        id: "kore-sub",
        module: "Korean", export: "Sebeolsik", numLeaves: 10206,
        remapFunc: _RemapTemplates.IDENTITY,
        displayName: "Korean Sebeolsik (세벌식 최종 키보드)",
        blurb: "Another Hangul keyboard layout used in South Korea, and the"
        + " final Sebeolsik layout designed by Dr. Kong Byung Woo, hence"
        + " the name. Syllable-initial consonants are on the right, final"
        + " consonants on the left, and vowels in the middle. It is more"
        + " ergonomic than the dubeolsik, but not widely used.",
    }, <const>{
        id: "kore-rom",
        module: "Korean", export: "Romanization", numLeaves: 3990,
        remapFunc: _RemapTemplates.TO_LOWER,
        displayName: "Korean Revised Romanization",
        blurb: "The Revised Romanization of Korean (국어의 로마자 표기법; 國語의 로마字"
        + " 表記法) is the official South Korean language romanization system. It"
        + " was developed by the National Academy of the Korean Language from 1995,"
        + " and was released on 7 July 2000 by South Korea's Ministry of Culture"
        + " and Tourism",
    },
    ].map((desc) => Object.freeze(desc)));
    FrontendDescs as TU.RoArr<FrontendDesc>;

    export type FrontendDesc = Readonly<{
        id:         string;
        module:     string;
        export:     string;
        remapFunc:  {(input: string): string};
        numLeaves:  number;
        displayName:string;
        blurb:      string;
    }>;

    /**
     *
     * @param langId -
     */
    export function GET_FRONTEND_DESC_BY_ID(langId: FrontendDesc["id"]): FrontendDesc {
        const desc = FrontendDescs.find((desc) => desc.id === langId);
        if (!desc) throw new Error(`Frontend descriptor of language with id`
        + ` \"${langId}\" not found.`);
        return desc!;
    }
}
Object.freeze(Lang);
Object.freeze(Lang.prototype);
