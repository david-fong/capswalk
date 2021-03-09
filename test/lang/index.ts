import "base/defs/ModNodePlatform";
import { Lang } from "base/lang/Lang";
import { LangDescs } from "base/lang/LangDescs";

Promise.all(Object.keys(LangDescs).map((langId) => Lang.IMPORT(langId).then((classIf) => {
	try {
		const inst = new (classIf)(1.0);
		const fed = inst.desc;
		inst.reset();

		// TODO.impl test a set of alphanumeric character inputs for each lang's remapping function.
		// also check that none of the weights are negative or zero.

		// if (!(_Lang.Seq.REGEXP.test(key))) {
		//     throw new RangeError(`The implementation of input transformation`
		//     + ` in the currently selected language did not follow the rule`
		//     + ` of producing output matching the regular expression`
		//     + ` \"${_Lang.Seq.REGEXP.source}\".`
		//     );
		// }

		return Object.freeze({
			name: fed.displayName,
			numOpts: fed.isolatedMinOpts,
		});
	} catch (e) {
		console.error(e);
	}
	return Object.freeze({ name: "error", numOpts: NaN, });
})))
.then((table) => console.table(table));