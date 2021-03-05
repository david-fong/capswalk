#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const webpack = require("webpack");

const configs = require("./webpack.config");

const DO_WATCH = process.argv.includes("--watch");
if (!DO_WATCH) console.info("*note: pass `--watch` for watch mode");
function DIST(rel = "") { return path.resolve(__dirname, "../../dist/", rel); }
function ROOT(rel = "") { return path.resolve(__dirname, "../../", rel); }

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
	//pkg["repository"] += "/tree/dist"; // Point to the dist branch.
	for (let [name, at] of Object.entries(pkg.dependencies)) {
		if (/^[\^~]$/.test(at[0])) {
			at = "=" + at.slice(1);
		}
		pkg.dependencies[name] = at;
	}
	fs.writeFile(
		DIST("package.json"),
		JSON.stringify(pkg, undefined, "  "),
		null, (err) => console.error(err),
	);
}


// https://webpack.js.org/api/node/
Object.values(configs).forEach((config) => {
	const compiler = webpack(config);
	if (DO_WATCH) {
		console.info(`running webpack in watch mode (${config.name}) ...`);
		compiler.watch(config.watchOptions, (stats) => {
			if (stats) console.log(stats);
		});
	}
	else {
		compiler.run((err, stats) => {
			console.log(`\n${"=".repeat(32)} ${config.name.toUpperCase()} ${"=".repeat(32)}\n`);
			if (err) {
				console.error(err.stack || err);
				if (err["details"]) { console.error(err["details"]); }
				return;
			}
			console.log(stats?.toString(config.stats));
			console.log();
		});
		compiler.close((err, result) => { });
	}
});


if (process.env.NODE_ENV === "production") {
	/** @type {(err: NodeJS.ErrnoException | null) => void} */
	function errCb(err) {
		if (err) console.error(err);
	}
	fs.copyFile(path.resolve(__dirname, "templates/stage.sh"), DIST("stage.sh"), errCb);
	fs.copyFile(ROOT(".gitattributes"), DIST(".gitattributes"), errCb);
	fs.copyFile(ROOT(".gitattributes"), DIST("client/.gitattributes"), errCb);
	fs.copyFile(ROOT("LICENSE.md"), DIST("LICENSE.md"), errCb);
	fs.copyFile(ROOT("LICENSE.md"), DIST("client/LICENSE.md"), errCb);
	fs.copyFile(ROOT(".gitignore"), DIST("client/LICENSE.md"), errCb);
	fs.writeFile(DIST(".git"       ), "gitdir: ../.git/worktrees/dist",   {}, errCb); // for repair purposes.
	fs.writeFile(DIST("client/.git"), "gitdir: ../.git/worktrees/client", {}, errCb); // for repair purposes.
	fs.writeFile(DIST("client/.nojekyll"), "", {}, errCb);
}