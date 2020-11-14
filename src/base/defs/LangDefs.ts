import { JsUtils } from "defs/JsUtils";

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
const REMAP = Object.freeze(<const>{
    IDENT: (input: string): string => input,
    LOWER: (input: string): string => input.toLowerCase(),
});
REMAP as Readonly<Record<string, {(input: string): string}>>;

export type Info = {
    id?:        string;
    /**
     * Pretty much a file name.
     */
    module:     string;
    /**
     * A property-access chain.
     */
    export:     string;
    remapFunc:  {(input: string): string};
    numLeaves:  number;
    displayName:string;
    blurb:      string;
};

/**
 *
 */
const Descs = <const>{
    "engl-low": <Info>{
        module: "English", export: "Lowercase", numLeaves: 26,
        remapFunc: REMAP.LOWER,
        displayName: "English Lowercase (qwerty)",
        blurb: "",
    },
    "engl-mix": <Info>{
        module: "English", export: "MixedCase", numLeaves: 52,
        remapFunc: REMAP.IDENT,
        displayName: "English Mixed-Case (Querty)",
        blurb: "",
    },
    "japn-hir": <Info>{
        module: "Japanese", export: "Hiragana", numLeaves: 71,
        remapFunc: REMAP.LOWER,
        displayName: "Japanese Hiragana",
        blurb: "",
    },
    "japn-kat": <Info>{
        module: "Japanese", export: "Katakana", numLeaves: 70,
        remapFunc: REMAP.LOWER,
        displayName: "Japanese Katakana",
        blurb: "",
    },
    "kore-dub": <Info>{
        module: "Korean", export: "Dubeolsik", numLeaves: 8778,
        remapFunc: REMAP.IDENT,
        displayName: "Korean Dubeolsik (두벌식 키보드)",
        blurb: "The most common keyboard layout, and South Korea's only Hangul"
        + " standard since 1969. Consonants are on the left, and vowels on"
        + " the right.",
    },
    "kore-sub": <Info>{
        module: "Korean", export: "Sebeolsik", numLeaves: 10206,
        remapFunc: REMAP.IDENT,
        displayName: "Korean Sebeolsik (세벌식 최종 키보드)",
        blurb: "Another Hangul keyboard layout used in South Korea, and the"
        + " final Sebeolsik layout designed by Dr. Kong Byung Woo, hence"
        + " the name. Syllable-initial consonants are on the right, final"
        + " consonants on the left, and vowels in the middle. It is more"
        + " ergonomic than the dubeolsik, but not widely used.",
    },
    "kore-rom": <Info>{
        module: "Korean", export: "Romanization", numLeaves: 3990,
        remapFunc: REMAP.LOWER,
        displayName: "Korean Revised Romanization",
        blurb: "The Revised Romanization of Korean (국어의 로마자 표기법; 國語의 로마字"
        + " 表記法) is the official South Korean language romanization system. It"
        + " was developed by the National Academy of the Korean Language from 1995,"
        + " and was released on 7 July 2000 by South Korea's Ministry of Culture"
        + " and Tourism",
    },
    "engl-cell-enc": <Info>{
        module: "English", export: "OldCellphone.Encode", numLeaves: 8,
        remapFunc: REMAP.IDENT,
        displayName: "Old Cellphone Keyboard",
        blurb: "",
    },
    "mors-enc": <Info>{
        module: "English", export: "Morse.Encode", numLeaves: 30,
        remapFunc: (input) => { return input; }, // TODO.impl
        displayName: "Morse Encoder",
        blurb: "",
    },
    "mors-dec": <Info>{
        module: "English", export: "Morse.Decode", numLeaves: 40,
        remapFunc: REMAP.LOWER,
        displayName: "Morse Decoder",
        blurb: "",
    },
};
Object.entries(Descs).forEach(([id,desc]) => {
    desc.id = id;
});
JsUtils.deepFreeze(Descs);
export default Descs;