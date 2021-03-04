import "base/defs/NodePlatformMods";
import type { Lang } from "base/lang/Lang";
import { English }  from "base/lang/impl/English";
import { Japanese } from "base/lang/impl/Japanese";
import { Korean }   from "base/lang/impl/Korean";
import { Ngrams }   from "base/lang/impl/Ngrams";

// PRINT ALL THE LANGS !!!
[
	English.Lowercase,
	English.MixedCase,
	English.Morse.Encode,
	English.Morse.Decode,
	English.OldCellphone.Encode,
	Japanese.Hiragana,
	Japanese.Katakana,
	Korean.Dubeolsik,
	Korean.Sebeolsik,
	Korean.Romanization,
	Ngrams.Ngram2,
	Ngrams.Ngram3,
]
.forEach((classIf: Lang.ClassIf) => {
	try {
		const inst = new (classIf)(1.0);
		const fed = inst.frontendDesc;
		inst.reset();
		console.info(
			 `\nName:              ${fed.displayName}`
			+`\nIsolated Min Opts: ${fed.isolatedMinOpts}`
		);
	} catch (e) {
		console.error(e);
	}

	// TODO.impl test a set of alphanumeric character inputs for each lang's remapping function.
	// also check that none of the weights are negative or zero.

	// if (!(_Lang.Seq.REGEXP.test(key))) {
	//     throw new RangeError(`The implementation of input transformation`
	//     + ` in the currently selected language did not follow the rule`
	//     + ` of producing output matching the regular expression`
	//     + ` \"${_Lang.Seq.REGEXP.source}\".`
	//     );
	// }
	debugger;
});