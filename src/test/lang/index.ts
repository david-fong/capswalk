import "my-type-utils/ModNodePlatform";
import { Lang, LangDescs } from ":lang/Lang";

type Row = {
	readonly name: string,
	readonly size: number,
	readonly numOpts: number,
	readonly avgWeight: number,
};

Promise.all(Object.keys(LangDescs).map((langId) => Lang.Import(langId).then((classIf) => {
	const inst = new (classIf)(1.0);
	const { desc, csps: csps } = inst;
	const avgWeight = csps.reduce<number>((sum,n) => sum+n.unscaledWt, 0) / csps.length;
	{
		const imo = inst._calcIsolatedMinOpts();
		if (imo !== desc.isolatedMinOpts) {
			console.error(`error: isolatedMinOpts for "${desc.id}" should be: ${imo}`);
		}
	}
	if (Math.abs((avgWeight - desc.avgWeight) / avgWeight) > 1E-12) {
		console.error(`maintenance required: the avgWeight constant`
		+` for the language "${desc.id}" needs to be updated to the`
		+` correct, computed value: ${avgWeight}.`);
	}
	//inst.reset();

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
		size: inst.csps.length,
		numOpts: desc.isolatedMinOpts,
		avgWeight,
	});
})))
.then((table) => console.table(table));