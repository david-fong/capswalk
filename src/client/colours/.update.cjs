#!/usr/env node --disable-proto=delete
const fs = require("fs");
const path = require("path");
const process = require("process");
const regex = {
	id: /\[data-colour-scheme="([a-z-]+)"]/,
	meta: /^\/\*\*\s+@title (?<title>[^\n]+)\s+@author (?<author>[^\n]+)\s+\*\/.*/m
}

/** @type {Map<string, string} */
const schemes = new Map(fs.readdirSync(path.resolve(__dirname, "schemes"))
	.map((id) => [
		id.split(".").slice(0,-1).join("."),
		fs.readFileSync(path.resolve(__dirname, "schemes", id), {encoding:"utf-8"})
	])
);
//console.log([...schemes.entries()]);


// Ensure that the file name is the same as the id in the CSS file
schemes.forEach((css, id) => {
	if (!regex.id.test(css)) {
		console.error(`"${id}" doesn't match \`${regex.id.source}\`.`);
	}
	const dataAttribute = regex.id.exec(css)[1];
	if (id !== dataAttribute) {
		console.error(`filename "${id}" doesn't equal data-attribute "${dataAttribute}"`);
	}
});


// Extract metadata from a comment in the CSS
const meta = [...schemes.entries()].map(([id, css]) => {
	const parsed = regex.meta.exec(css);
	if (parsed === null) {
		console.error(`Failed to parse metadata from css header comment in \`${id}\``);
		return null;
	}
	const title  = parsed.groups["title"];
	const author = parsed.groups["author"];
	return { id, displayName: title, author };
});
if (meta.includes(null)) {
	console.error("Exiting due to parsing errors. Output file will not be emitted.");
	process.exit(1);
}
meta.unshift({ id: "default", displayName: "Default", author: "N.W." });


// Write to the output file
fs.writeFileSync(
	path.resolve(__dirname, "schemes.json"),
	JSON.stringify(meta, null, "\t"),
	{encoding:"utf-8"}
);