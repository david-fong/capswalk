import fs      = require("fs");
import path    = require("path");
import webpack = require("webpack");
import configs = require("./webpack.config");

import type * as DistPkg from "./templates/package.json";
if (process.env.NODE_ENV === "production") {
	// Generate dist/package.json:
	const srcPkgKeys = Object.freeze(<const>[
		"name", "author",
		"description", "keywords",
		"version", "dependencies", "repository",
	]);
	const  srcPkg = require("../../package.json") as Record<typeof srcPkgKeys[number], any>;
	const distPkg = require("./templates/package.json");
	const pkg = distPkg as (typeof DistPkg & typeof srcPkg); (
		srcPkgKeys).forEach((key) => { pkg[key] = srcPkg[key]; });
	pkg["repository"] += "/tree/dist"; // Point to the dist branch.
	for (let [name,at] of Object.entries<string>(pkg.dependencies)) {
		if (at[0] === "^") { at = "=" + at.slice(1); }
		pkg.dependencies[name] = at;
	}

	fs.writeFile(
		path.resolve(__dirname, "../../dist/package.json"),
		JSON.stringify(pkg, undefined, "  "),
		null, (err) => console.error(err),
	);
}


// This way, I don't need to install webpack-cli,
// which pulls in hundreds of packages for some reason.
// https://webpack.js.org/api/node/
(configs as webpack.Configuration[]).forEach((config) => {
	const compiler = webpack(config);
	compiler.run((err, stats) => {
		console.log(`\n\n${"=".repeat(32)} ${config.name!.toUpperCase()} ${"=".repeat(32)}\n`);
		if (err) {
			console.error(err.stack || err);
			if (err["details"]) {
				console.error(err["details"]);
			}
			return;
		}
		console.log(stats?.toString(config.stats));
		console.log();
	});
	compiler.close((err, result) => {});
});