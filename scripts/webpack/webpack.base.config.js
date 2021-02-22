"use strict";
const path = require("path");
const webpack = require("webpack");
const esbuildLoader = require("esbuild-loader");
const nodeExternals = require("webpack-node-externals");
/** @typedef {<T, K extends keyof T>() => T & Pick<Required<T>, K>} Require */

const MODE = (() => {
	const val = (process.env.NODE_ENV) || "development";
	return Object.freeze({ val, dev: (val === "development"), prod: (val === "production") });
})();
exports.MODE = MODE;

const PROJECT_ROOT = (...relative) => path.resolve(__dirname, "../..", ...relative);
exports.PROJECT_ROOT = PROJECT_ROOT;

exports.GAME_SERVERS = require("../../servers.json");
const DO_SOURCE_MAPS = process.argv.includes("-m");

/** @type {() => ReadonlyArray<Readonly<webpack.WebpackPluginInstance>>} */
const BASE_PLUGINS = () => { return [
	new webpack.DefinePlugin({
		// See [](src/node_modules/@types/my-type-utils.dts).
		"DEF.PRODUCTION": JSON.stringify(MODE.prod),
		"DEF.NodeEnv":    JSON.stringify(MODE.val),
		"DEF.DevAssert":  JSON.stringify(MODE.dev),
	}),
	new esbuildLoader.ESBuildPlugin(),
];};
exports.BASE_PLUGINS = BASE_PLUGINS;

/**
 * https://webpack.js.org/loaders/
 * @type {() => Array<webpack.RuleSetRule>}
 */
exports.MODULE_RULES = () => {
	return [{
		test: /\.ts$/,
		exclude: [/node_modules/, /\.d\.ts$/],
		use: {
			loader: "esbuild-loader",
			options: { loader: "ts", target: "es2017" },
		},
	}, {
		test: /\.json5$/,
		type: "json",
		parser: { parse: require("json5").parse },
	},];
};

/**
 * - [typescript docs](https://www.typescriptlang.org/docs/handbook/react-&-webpack.html)
 * - [webpack config](https://webpack.js.org/configuration/configuration-languages/#typescript)
 * - [ts-loader](https://github.com/TypeStrong/ts-loader#loader-options)
 *
 * @returns A standalone ("deep-copy") basic configuration.
 * @type {() => webpack.Configuration & Pick<Required<webpack.Configuration>, "entry" | "plugins" | "resolve" | "output">}
 */
exports.__BaseConfig = (distSubFolder) => { return {
	mode: MODE.val,
	name: distSubFolder,
	stats: {
		children: false,
		colors: true,
	},
	context: PROJECT_ROOT(),
	entry: { /* Left to each branch config */},
	plugins: [...BASE_PLUGINS(),],
	resolve: {
		extensions: [".ts", ".js"],
		modules: [
			PROJECT_ROOT("src"),
			PROJECT_ROOT("src/base"),
			PROJECT_ROOT("node_modules"),
		],
		alias: { /* Left to each branch config */},
	},
	resolveLoader: {
		modules: [PROJECT_ROOT("scripts/webpack/node_modules")],
	},
	module: { rules: exports.MODULE_RULES(), },
	// https://webpack.js.org/plugins/source-map-dev-tool-plugin/
	devtool: (MODE.prod)
		? "nosources-source-map"
		: (DO_SOURCE_MAPS ? "source-map" : false),
	output: {
		path: PROJECT_ROOT("dist", distSubFolder),
		publicPath: `./`,
		filename: "[name].js",
		chunkFilename: "chunk/[name].js",
		library: "capswalk",
		pathinfo: false,
	},
	optimization: {
		splitChunks: { chunks: "all", cacheGroups: {} },
		removeAvailableModules: (MODE.prod),
	},
	watchOptions: {
		ignored: ["node_modules", "**/*.d.ts", "**/*.js",],
	},
};};

/**
 */
exports.__applyCommonNodeConfigSettings = (config) => {
	config.target = "node14";
	config.externals = [nodeExternals()];
	// alternative to above: fs.readdirsync(path.resolve(PROJECT_ROOT, "node_modules"))
	config.node = {
		__filename: false,
		__dirname: false,
		global: false,
	};
	// https://code.visualstudio.com/docs/nodejs/nodejs-debugging#_javascript-source-map-tips
	// https://webpack.js.org/configuration/output/#outputdevtoolmodulefilenametemplate
	config.output.devtoolModuleFilenameTemplate = "../[resource-path]?[loaders]";
	config.devtool = (MODE.prod) ? "source-map"
		: (DO_SOURCE_MAPS ? "eval-cheap-module-source-map" : false);
		// ^vscode not quite working without eval
};
