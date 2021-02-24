// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration
const path = require("path");
function ROOT(...rel) { return path.resolve(__dirname, "../..", ...rel); }
function SRC(...rel) { return path.resolve(__dirname, "../../src", ...rel); }

/** @type {import("snowpack").SnowpackUserConfig} */
module.exports = {
	root: ROOT(),
	exclude: ["**/node_modules/**/*"],
	mount: {
		/* ... */
	},
	alias: {
	},
	plugins: [
		/* ... */
	],
	packageOptions: {
		/* ... */
		source: "local",
	},
	devOptions: {
		/* ... */
		port: 8080,
	},
	buildOptions: {
		/* ... */
		out: "dist/snowpack",
		sourcemap: true,
	},
};
