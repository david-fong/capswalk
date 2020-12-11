import path     = require("path");
import webpack  = require("webpack");

// https://github.com/TypeStrong/ts-loader#loader-options
import type * as tsloader from "ts-loader/dist/interfaces";

import nodeExternals        = require("webpack-node-externals");
import HtmlPlugin           = require("html-webpack-plugin");
import CspHtmlPlugin        = require("csp-html-webpack-plugin");
import MiniCssExtractPlugin = require("mini-css-extract-plugin");
import CssMinimizerPlugin   = require("css-minimizer-webpack-plugin");
import CompressionPlugin    = require("compression-webpack-plugin");
type SplitChunksOpts = Exclude<NonNullable<webpack.Configuration["optimization"]>["splitChunks"], undefined | false>["cacheGroups"];

type Require<T, K extends keyof T> = T & Pick<Required<T>, K>;


const PACK_MODE = (process.env.NODE_ENV) as ("development" | "production") || "development";
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const GAME_SERVERS = require("../../servers.json");

const BASE_PLUGINS = (): ReadonlyArray<Readonly<webpack.WebpackPluginInstance>> => { return [
	new webpack.WatchIgnorePlugin({ paths: [
		/\.d\.ts$/, // Importantly, this also covers .css.d.ts files.
		/\.js$/,
	]}),
	new webpack.DefinePlugin({
		// See [](src/node_modules/@types/my-type-utils.dts).
		"DEF.PRODUCTION": JSON.stringify(PACK_MODE === "production"),
		"DEF.NodeEnv":   JSON.stringify(PACK_MODE),
		"DEF.DevAssert": JSON.stringify(PACK_MODE === "development"),
	}),
]};

/**
 * https://webpack.js.org/loaders/
 */
const MODULE_RULES = (): Array<webpack.RuleSetRule> => { return [{
	test: /\.ts$/,
	use: {
		loader: "ts-loader",
		options: <tsloader.LoaderOptions>{
			projectReferences: true,
			compilerOptions: {
				removeComments: false, // needed for webpack-import magic-comments
				assumeChangesOnlyAffectDirectDependencies: PACK_MODE === "development",
				//noEmit: true,
			},
			// https://github.com/TypeStrong/ts-loader#faster-builds
			transpileOnly: true,
			experimentalWatchApi: true,
			experimentalFileCaching: true,
		},
	},
	exclude: [/node_modules/,/\.d\.ts$/],
}, ];};
const WEB_MODULE_RULES = (): Array<webpack.RuleSetRule> => { return [{
	test: /\.css$/,
	issuer: { not: [/\.m\.css/] },
	use: [{
		loader: MiniCssExtractPlugin.loader, options: {}
	},{
		loader: "css-modules-typescript-loader",
	},{
		loader: "css-loader", options: {
			modules: {
				auto: /\.m\.css$/,
				localIdentName: "[name]_[local]_[hash:base64:5]",
			},
		},
	}],
},{
	// https://webpack.js.org/loaders/file-loader/
	test: /\.(png|svg|jpe?g|gif)$/,
	issuer: /\.css$/,
	use: [(() => {
		const pathFunc = (url: string, resourcePath: string, context: string) => {
			return path.relative(context, resourcePath).replace(/\\/g, "/");
		};
		return {
		loader: "file-loader",
		options: {
			context: path.resolve(PROJECT_ROOT, "assets"),
			//name: "[name].[ext]",
			outputPath: pathFunc,
			publicPath: pathFunc,
		},};
	})()],
}, ];}

/**
 * - [typescript docs](https://www.typescriptlang.org/docs/handbook/react-&-webpack.html)
 * - [webpack config](https://webpack.js.org/configuration/configuration-languages/#typescript)
 * - [ts-loader](https://github.com/TypeStrong/ts-loader#loader-options)
 *
 * @returns A standalone ("deep-copy") basic configuration.
 */
const __BaseConfig = (distSubFolder: string): Require<webpack.Configuration,
"entry" | "plugins" | "resolve" | "output"> => { return {
	mode: PACK_MODE,
	name: distSubFolder,
	stats: { /* https://webpack.js.org/configuration/stats/ */
		children: false,
		colors: true,
	},

	context: PROJECT_ROOT, // https://webpack.js.org/configuration/entry-context/#context
	entry: { /* Left to each branch config */ },
	plugins: [ ...BASE_PLUGINS(), ],
	resolve: {
		extensions: [".ts", ".js"],
		modules: [
			path.resolve(PROJECT_ROOT, "src"),
			path.resolve(PROJECT_ROOT, "src/base"),
			path.resolve(PROJECT_ROOT, "node_modules"),
		], // match tsconfig.baseUrl
		alias: { /* Left to each branch config */ },
	},
	module: { rules: MODULE_RULES(), },
	// https://webpack.js.org/plugins/source-map-dev-tool-plugin/
	devtool: (PACK_MODE === "production")
		? "nosources-source-map"
		: "cheap-source-map",
	output: {
		path: path.resolve(PROJECT_ROOT, "dist", distSubFolder),
		publicPath: `./`, // need trailing "/".
		filename: "[name].js",
		chunkFilename: "chunk/[name].js",
		library: "snakey3",
		pathinfo: false, // unneeded. minor performance gain.
	},

	optimization: {
		minimizer: [new CssMinimizerPlugin({
			minimizerOptions: { preset: ["default", { discardComments: { removeAll: true }}], },
		}), "..."],
		splitChunks: { chunks: "all", cacheGroups: {} },
		removeAvailableModules: (PACK_MODE === "production"),
	},
	watchOptions: {
		ignored: [ "node_modules", ],
	},
}; };





/**
 * ## Web Bundles
 */
const CLIENT_CONFIG = __BaseConfig("client"); {
	const config  = Object.assign(CLIENT_CONFIG, <Partial<webpack.Configuration>>{
		target: ["web", "es6"],
		entry: {
			"index": {
				import: "./src/client/index.ts",
				dependOn: "css-common",
			},
			"css-common": {
				import: "./src/style/common.css",
			},
		},
		externals: [nodeExternals({
			allowlist: ["tslib", "socket.io-client"],
			importType: "root",
		})],
	});
	config.resolve.modules!.push(path.resolve(PROJECT_ROOT)); // for requiring assets.
	config.module!.rules!.push(...WEB_MODULE_RULES());
	Object.assign(config.resolve.alias, {
		"socket.io-client": path.resolve(PROJECT_ROOT,
		`node_modules/socket.io-client/dist/socket.io${
			(PACK_MODE === "development") ? "" : ".min"
		}.js`),
	});
	Object.assign((config.optimization?.splitChunks as any).cacheGroups, <SplitChunksOpts>{
		"game-css": {
			test: /src[/\\]base[/\\].*\.css$/,
			name: "game-css",
			chunks: "all",
			priority: 1,
			reuseExistingChunk: true,
		},
	});
	const htmlPluginOptions: HtmlPlugin.Options = {
		template: path.resolve(PROJECT_ROOT, "src/client/index.ejs"),
		favicon: "./assets/favicon.png",
		scriptLoading: "defer",
		inject: false, // (I'll do it myself).
		templateParameters: (compilation, assets, assetTags, options) => { return {
			compilation, webpackConfig: compilation.options,
			htmlWebpackPlugin: { tags: assetTags, files: assets, options, },
			// Custom HTML templates for index.ejs:
			wellKnownGameServers: require(path.resolve(PROJECT_ROOT, "servers.json")),
		}; },
		//hash: true,
	};
	config.plugins.push(
		new HtmlPlugin(htmlPluginOptions),
		// new HtmlPlugin(Object.assign({}, htmlPluginOptions, <HtmlPlugin.Options>{
		// 	chunks: [],
		// 	filename: "404.html",
		// })),
		new CspHtmlPlugin({
			"default-src": ["'self'"],
			"script-src": "'self'", "style-src": "'self'",
			"child-src": "'none'", "object-src": "'none'", "base-uri": "'none'",
			"connect-src": ["'self'", ...GAME_SERVERS.map((origin: string) => `wss://${origin}/socket.io/`)],
			"form-action": "'none'",
		},{
			hashingMethod: "sha256",
			hashEnabled:  { "script-src": true,  "style-src": false },
			nonceEnabled: { "script-src": false, "style-src": false },
		}),
		new MiniCssExtractPlugin({
			filename: "[name].css",
			chunkFilename: "chunk/[name].css",
			attributes: { disable: "true" }, // TODO.design this is a little weird. Used for moving to shadow-root.
		}) as unknown as webpack.WebpackPluginInstance,
	);
	if (PACK_MODE === "production") { config.plugins.push(
		new CompressionPlugin({
			filename: "[path][base].br[query]",
			algorithm: "brotliCompress",
			test: /\.(js|css|html|svg)$/,
			compressionOptions: { params: {} /* https://brotli.org/encode.html */ },
			threshold: 10240,
			minRatio: 0.8,
		}),
	); }
}



/**
 */
const __applyCommonNodeConfigSettings = (config: ReturnType<typeof __BaseConfig>): void => {
	config.target = "node12";
	config.externals = [ nodeExternals(), ], // <- Does not whitelist tslib.
	// alternative to above: fs.readdirsync(path.resolve(PROJECT_ROOT, "node_modules"))
	config.resolve.extensions!.push(".js");
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

/**
 */
const SERVER_CONFIG = __BaseConfig("server"); {
	const config = SERVER_CONFIG;
	__applyCommonNodeConfigSettings(config);
	config.entry["index"] = `./src/server/index.ts`;
}

/**
 */
const TEST_CONFIG = __BaseConfig("test"); {
	const config = TEST_CONFIG;
	config.resolve.modules!.push(path.resolve(PROJECT_ROOT, "src"));
	__applyCommonNodeConfigSettings(config);
	(<const>[ "lang", ]).forEach((name) => {
		config.entry[name] = `./test/${name}/index.ts`;
	});
}



module.exports = [
	CLIENT_CONFIG,
	SERVER_CONFIG,
	//TEST_CONFIG,
];