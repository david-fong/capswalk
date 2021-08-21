"use strict";
const path = require("path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
/** @typedef {<T, K extends keyof T>() => T & Pick<Required<T>, K>} Require */
/** @typedef {webpack.Configuration & Pick<Required<webpack.Configuration>, "entry" | "plugins" | "resolve" | "output">} BaseConfig */

const MODE = (() => {
	const val = (process.env.NODE_ENV) || "development";
	return Object.freeze({ val, dev: (val === "development"), prod: (val === "production") });
})();
exports.MODE = MODE;

const PROJECT_ROOT = (() => { const R = path.resolve(__dirname, "../.."); return (...relative) => path.resolve(R, ...relative); })();
exports.PROJECT_ROOT = PROJECT_ROOT;

exports.GAME_SERVERS = require("../../servers.json");

/** @type {() => readonly Readonly<webpack.WebpackPluginInstance>[]} */
const BASE_PLUGINS = () => Object.freeze([
	new webpack.DefinePlugin({
		// See [](src/node_modules/my-type-utils.dts).
		"DEF.PRODUCTION": JSON.stringify(MODE.prod),
		"DEF.NodeEnv":    JSON.stringify(MODE.val),
		"DEF.DevAssert":  JSON.stringify(MODE.dev),
	}),
	{apply(compiler) { compiler.hooks.normalModuleFactory.tap("HomeBaseResolverPlugin", (nmf) => {
		// === My custom resolver ===
		nmf.hooks.beforeResolve.tap("ColonsResolverPlugin", (r) => {
			if (r.request[0] === ":") {
				if (r.request[1] === ":") {
					r.request = PROJECT_ROOT("src", compiler.name, r.request.substring(2)); return;
				}
				r.request = PROJECT_ROOT("src/base", r.request.substring(1)); return;
			}
		});
	}); }}
]);
exports.BASE_PLUGINS = BASE_PLUGINS;

/**
 * https://webpack.js.org/loaders/
 * @type {() => Array<webpack.RuleSetRule>}
 */
exports.MODULE_RULES = () => [{
	test: /\.ts$/,
	exclude: [PROJECT_ROOT("node_modules/"), /\.d\.ts$/],
	use: {
		loader: "esbuild-loader",
		options: { loader: "ts", target: "es2017" },
		/* loader: "swc-loader",
		options: { jsc: {
			target: "es2017",
			//externalHelpers: true,
			parser: { syntax: "typescript", dynamicImport: true },
		}}, */
	},
},{
	test: /\.json5$/,
	type: "json",
	parser: { parse: require("json5").parse },
}];

/**
 * - [typescript docs](https://www.typescriptlang.org/docs/handbook/react-&-webpack.html)
 * - [webpack config](https://webpack.js.org/configuration/configuration-languages/#typescript)
 *
 * @returns A standalone ("deep-copy") basic configuration.
 * @type {() => BaseConfig}
 */
exports.__BaseConfig = (distSubFolder) => ({
	// Bundler Options:
	mode: MODE.val,
	context: PROJECT_ROOT(),
	resolveLoader: {
		modules: [PROJECT_ROOT("scripts/webpack/node_modules")],
	},
	watchOptions: {
		ignored: [PROJECT_ROOT("node_modules/"), "**/*.d.ts"],
	},
	plugins: [...BASE_PLUGINS()],
	stats: {
		children: false,
		colors: true,
	},

	//
	name: distSubFolder,
	entry: {/* Left to each branch config */},
	resolve: {
		extensions: [".ts", ".js"],
		modules: [
			PROJECT_ROOT("src/node_modules"),
		],
		alias: {/* Left to each branch config */},
	},
	module: { rules: exports.MODULE_RULES(), noParse: /jquery|lodash/ },
	// https://webpack.js.org/plugins/source-map-dev-tool-plugin/
	devtool: (MODE.prod)
		? "nosources-source-map"
		: "source-map",
	output: {
		path: PROJECT_ROOT("dist", distSubFolder),
		publicPath: `./`,
		filename: "[name].js",
		chunkFilename: "chunk/[name].js",
		assetModuleFilename: "assets/[hash][ext][query]",
		library: "capswalk",
		pathinfo: false,
	},
	optimization: {
		splitChunks: { chunks: "all", cacheGroups: {} },
		removeAvailableModules: (MODE.prod),
	},
});

/**
 * @type {(config: BaseConfig) => void}
 */
exports.__applyCommonNodeConfigSettings = (config) => {
	config.externals = [nodeExternals()];
	config.target = "node14";
	config.node = {
		__filename: false,
		__dirname: false,
		global: false,
	};
	// https://code.visualstudio.com/docs/nodejs/nodejs-debugging#_javascript-source-map-tips
	// https://webpack.js.org/configuration/output/#outputdevtoolmodulefilenametemplate
	config.output.devtoolModuleFilenameTemplate = "../[resource-path]?[loaders]";
	config.devtool = (MODE.prod) ? "source-map"
		: "eval-cheap-module-source-map";
		// ^vscode not quite working without eval
};
