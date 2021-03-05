import { JsUtils } from "defs/JsUtils";

const REMAP = Object.freeze(<const>{
	IDENT: (input: string): string => input,
	LOWER: (input: string): string => input.toLowerCase(),
});
REMAP as Readonly<Record<string, {(input: string): string}>>;

export type Info = {
	id?: string;
	/** Pretty much a file name. */
	module: string;
	/** A property-access chain. */
	export: string;
	/** The output must match against `Lang.Seq.REGEXP`. */
	remapFunc: {(input: string): string};
	/** */
	isolatedMinOpts: number;
	displayName:string;
	blurb: string;
};

/**
 *
 */
const Descs: Record<string, Info> = {
	"engl-low": {
		module: "English", export: "Lowercase", isolatedMinOpts: 25,
		remapFunc: REMAP.LOWER,
		displayName: "English Lowercase (qwerty)",
		blurb: "",
	},
	"engl-mix": {
		module: "English", export: "MixedCase", isolatedMinOpts: 51,
		remapFunc: REMAP.IDENT,
		displayName: "English Mixed-Case (Querty)",
		blurb: "",
	},
	"japn-hir": {
		module: "Japanese", export: "Hiragana", isolatedMinOpts: 70,
		remapFunc: REMAP.LOWER,
		displayName: "Japanese Hiragana",
		blurb: "",
	},
	"japn-kat": {
		module: "Japanese", export: "Katakana", isolatedMinOpts: 68,
		remapFunc: REMAP.LOWER,
		displayName: "Japanese Katakana",
		blurb: "",
	},
	"kore-dub": {
		module: "Korean", export: "Dubeolsik", isolatedMinOpts: 8690,
		remapFunc: REMAP.IDENT,
		displayName: "Korean Dubeolsik (두벌식 키보드)",
		blurb: "The most common keyboard layout, and South Korea's only Hangul"
		+" standard since 1969. Consonants are on the left, and vowels on"
		+" the right.",
	},
	"kore-sub": {
		module: "Korean", export: "Sebeolsik", isolatedMinOpts: 10179,
		remapFunc: REMAP.IDENT,
		displayName: "Korean Sebeolsik (세벌식 최종 키보드)",
		blurb: "Another Hangul keyboard layout used in South Korea, and the"
		+" final Sebeolsik layout designed by Dr. Kong Byung Woo, hence"
		+" the name. Syllable-initial consonants are on the right, final"
		+" consonants on the left, and vowels in the middle. It is more"
		+" ergonomic than the dubeolsik, but not widely used.",
	},
	"kore-rom": {
		module: "Korean", export: "Romanization", isolatedMinOpts: 3960,
		remapFunc: REMAP.LOWER,
		displayName: "Korean Revised Romanization",
		blurb: "The Revised Romanization of Korean (국어의 로마자 표기법; 國語의 로마字"
		+" 表記法) is the official South Korean language romanization system. It"
		+" was developed by the National Academy of the Korean Language from 1995,"
		+" and was released on 7 July 2000 by South Korea's Ministry of Culture"
		+" and Tourism",
	},
	"engl-cell-enc": {
		module: "English", export: "OldCellphone.Encode", isolatedMinOpts: 7,
		remapFunc: REMAP.IDENT,
		displayName: "Old Cellphone Keyboard",
		blurb: "",
	},
	"mors-enc": {
		module: "English", export: "Morse.Encode", isolatedMinOpts: 10,
		remapFunc: (input) => { return input; }, // TODO.impl
		displayName: "Morse Encoder",
		blurb: "",
	},
	"mors-dec": {
		module: "English", export: "Morse.Decode", isolatedMinOpts: 40,
		remapFunc: REMAP.LOWER,
		displayName: "Morse Decoder",
		blurb: "",
	},
	"ngram2": {
		module: "Ngrams", export: "Ngram2", isolatedMinOpts: 199,
		remapFunc: REMAP.LOWER,
		displayName: "English Bigrams",
		blurb: "",
	},
	"ngram3": {
		module: "Ngrams", export: "Ngram3", isolatedMinOpts: 400,
		remapFunc: REMAP.LOWER,
		displayName: "English Trigrams",
		blurb: "",
	},
	"numpad": {
		module: "Numpad", export: "Numpad", isolatedMinOpts: 100,
		remapFunc: REMAP.LOWER,
		displayName: "Number Pad",
		blurb: "",
	},
};
Object.entries(Descs).freeze().forEach(([id,desc]) => {
	desc.id = id;
});
JsUtils.deepFreeze(Descs);
export default Descs;