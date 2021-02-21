import path = require("path");
import webpack = require("webpack");
import { ESBuildPlugin } from "esbuild-loader";
import nodeExternals = require("webpack-node-externals");
type Require<T, K extends keyof T> = T & Pick<Required<T>, K>;

export const PACK_MODE = (process.env.NODE_ENV) as ("development" | "production") || "development";
export const PROJECT_ROOT = (...relative: string[]) => path.resolve(__dirname, "../..", ...relative);
export const GAME_SERVERS = require("../../servers.json");

export const BASE_PLUGINS = (): ReadonlyArray<Readonly<webpack.WebpackPluginInstance>> => { return [
	new webpack.DefinePlugin({
		// See [](src/node_modules/@types/my-type-utils.dts).
		"DEF.PRODUCTION": JSON.stringify(PACK_MODE === "production"),
		"DEF.NodeEnv":    JSON.stringify(PACK_MODE),
		"DEF.DevAssert":  JSON.stringify(PACK_MODE === "development"),
	}),
	new ESBuildPlugin(),
]};

/** https://webpack.js.org/loaders/ */
export const MODULE_RULES = (): Array<webpack.RuleSetRule> => { return [{
	test: /\.ts$/,
	exclude: [/node_modules/, /\.d\.ts$/],
	use: {
		loader: "esbuild-loader",
		options: {
			loader: "ts",
		},
	},
}, {
	test: /\.json5$/,
	type: "json",
	parser: { parse: require("json5").parse },
}, ];};

/**
 * - [typescript docs](https://www.typescriptlang.org/docs/handbook/react-&-webpack.html)
 * - [webpack config](https://webpack.js.org/configuration/configuration-languages/#typescript)
 * - [ts-loader](https://github.com/TypeStrong/ts-loader#loader-options)
 *
 * @returns A standalone ("deep-copy") basic configuration.
 */
export const __BaseConfig = (distSubFolder: string): Require<webpack.Configuration,
"entry" | "plugins" | "resolve" | "output"> => { return {
	mode: PACK_MODE,
	name: distSubFolder,
	stats: { /* https://webpack.js.org/configuration/stats/ */
		children: false,
		colors: true,
	},

	context: PROJECT_ROOT(), // https://webpack.js.org/configuration/entry-context/#context
	entry: { /* Left to each branch config */ },
	plugins: [ ...BASE_PLUGINS(), ],
	resolve: {
		extensions: [".ts", ".js"],
		modules: [
			PROJECT_ROOT("src"),
			PROJECT_ROOT("src/base"),
			PROJECT_ROOT("node_modules"),
		], // match tsconfig.baseUrl
		alias: { /* Left to each branch config */ },
	},
	resolveLoader: {
		modules: [PROJECT_ROOT("scripts/webpack/node_modules")],
	},
	module: { rules: MODULE_RULES(), },
	// https://webpack.js.org/plugins/source-map-dev-tool-plugin/
	devtool: (PACK_MODE === "production")
		? "nosources-source-map"
		: "cheap-source-map",
	output: {
		path: PROJECT_ROOT("dist", distSubFolder),
		publicPath: `./`, // need trailing "/".
		filename: "[name].js",
		chunkFilename: "chunk/[name].js",
		library: "capswalk",
		pathinfo: false, // unneeded. minor performance gain.
	},

	optimization: {
		splitChunks: { chunks: "all", cacheGroups: {} },
		removeAvailableModules: (PACK_MODE === "production"),
	},
	/* cache: {
		type: "filesystem",
		buildDependencies: {
			config: [__filename],
		},
	}, */
	watchOptions: {
		ignored: [ "node_modules", "**/*.d.ts", "**/*.js", ],
	},
	// experiments: {
	// 	outputModule: true,
	// },
}; };


/**
 */
export const __applyCommonNodeConfigSettings = (config: ReturnType<typeof __BaseConfig>): void => {
	config.target = "node14";
	config.externals = [ nodeExternals(), ], // <- Does not whitelist tslib.
	// alternative to above: fs.readdirsync(path.resolve(PROJECT_ROOT, "node_modules"))
	config.node = {
		__filename: false,
		__dirname: false,
		global: false,
		//"fs": "empty", "net": "empty", <- may solve tricky problems if they come up.
	};
	// https://code.visualstudio.com/docs/nodejs/nodejs-debugging#_javascript-source-map-tips
	// https://webpack.js.org/configuration/output/#outputdevtoolmodulefilenametemplate
	config.output.devtoolModuleFilenameTemplate = "../[resource-path]?[loaders]";
	config.devtool = (PACK_MODE === "production")
		? "cheap-module-source-map"
		: "cheap-module-source-map";
};