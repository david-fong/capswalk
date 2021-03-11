import "base/defs/ModNodePlatform";
import { Lang, LangDescs } from "base/lang/Lang";

type Row = {
	readonly name: string,
	readonly numOpts: number,
	readonly avgWeight: number,
};

Promise.all(Object.keys(LangDescs).map((langId) => Lang.IMPORT(langId).then((classIf) => {
	const inst = new (classIf)(1.0);
	const { desc, dict: csps } = inst;
	const avgWeight = csps.reduce<number>((sum,n) => sum+n.weight, 0) / csps.length;
	{
		const imo = inst._calcIsolatedMinOpts();
		if (imo !== desc.isolatedMinOpts) {
			console.error(`maintenance required: the isolatedMinOpts`
			+` constant for the language "${desc.id}" needs to be updated`
			+` to the correct, computed value: ${imo}.`);
		}
	}
	if (Math.abs((avgWeight - desc.avgWeight) / avgWeight) > 1E-12) {
		console.error(`maintenance required: the avgWeight constant`
		+` for the language "${desc.id}" needs to be updated to the`
		+` correct, computed value: ${avgWeight}.`);
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
})))
.then((table) => console.table(table));