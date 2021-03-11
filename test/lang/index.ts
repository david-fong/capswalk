import "base/defs/ModNodePlatform";
import { Lang, LangDescs } from "base/lang/Lang";

type Row = {
	readonly name: string,
	readonly numOpts: number,
	readonly avgWeight: number,
};

Promise.all(Object.keys(LangDescs).map((langId) => Lang.IMPORT(langId).then((classIf) => {
	try {
		const inst = new (classIf)(1.0);
		const { desc, dict: nodes } = inst;
		const avgWeight = nodes.reduce<number>((sum,n) => sum+n.weight, 0) / nodes.length;
		{
			const imo = inst._calcIsolatedMinOpts();
			if (imo !== desc.isolatedMinOpts) {
				throw new Error(`maintenance required: the desc constant for`
				+` the language "${desc.id}" needs to be updated to the`
				+` correct, computed value: ${imo}.`);
			}
		}
		inst.reset();

		// TODO.impl test a set of alphanumeric character inputs for each lang's remapping function.
		// also check that none of the weights are negative or zero.

		/*if (!(_Lang.Seq.REGEXP.test(key))) {
		    throw new RangeError(`The implementation of input transformation`
		    +` in the currently selected language did not follow the rule`
		    +` of producing output matching the regular expression`
		    +` \"${_Lang.Seq.REGEXP.source}\".`
		    );
		}*/
		return Object.freeze<Row>({
			name: desc.displayName,
			numOpts: desc.isolatedMinOpts,
			avgWeight,
		});
	} catch (e) {
		console.error(e);
	}
	return Object.freeze(<Row>{ name: "error", numOpts: NaN, avgWeight: NaN });
})))
.then((table) => console.table(table));