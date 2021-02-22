"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
/** @type {readonly webpack.Configuration[]} */
const configs = require("./webpack.config");

const DO_WATCH = process.env.WEBPACK_WATCH !== undefined;

if (process.env.NODE_ENV === "production") {
	// Generate dist/package.json:
	const srcPkgKeys = Object.freeze([
		"name", "license", "author",
		"description", "keywords",
		"version", "dependencies", "repository",
	]);
	const srcPkg = require("../../package.json");
	const distPkg = require("./templates/package.json");
	const pkg = distPkg;
	(srcPkgKeys).forEach((key) => { pkg[key] = srcPkg[key]; });
	pkg["repository"] += "/tree/dist"; // Point to the dist branch.
	for (let [name, at] of Object.entries(pkg.dependencies)) {
		if (/^[\^~]$/.test(at[0])) {
			at = "=" + at.slice(1);
		}
		pkg.dependencies[name] = at;
	}
	fs.writeFile(
		path.resolve(__dirname, "../../dist/package.json"),
		JSON.stringify(pkg, undefined, "  "),
		null, (err) => console.error(err),
	);
}


// https://webpack.js.org/api/node/
configs.forEach((config) => {
	const compiler = webpack(config);
	if (DO_WATCH) {
		compiler.watch(config.watchOptions, (stats) => {
			if (stats)
				console.log(stats);
		});
	}
	else {
		compiler.run((err, stats) => {
			console.log(`\n\n${"=".repeat(32)} ${config.name.toUpperCase()} ${"=".repeat(32)}\n`);
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
		compiler.close((err, result) => { });
	}
});
