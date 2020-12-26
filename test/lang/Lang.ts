import { English } from "base/lang/impl/English";
import { Japanese } from "base/lang/impl/Japanese";
import { Korean } from "base/lang/impl/Korean";


export namespace Lang {
	// PRINT ALL THE LANGS !!!
	[
		English.Lowercase,
		English.MixedCase,
		Japanese.Hiragana,
		Japanese.Katakana,
		Korean.Dubeolsik,
		Korean.Sebeolsik,
		Korean.Romanization,
	]
	.forEach((langImpl) => {
		const inst = new (langImpl)(1.0);
		inst.reset();
		console.info(inst);

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
}
