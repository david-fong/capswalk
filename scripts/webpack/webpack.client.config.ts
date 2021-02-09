import path     = require("path");
import webpack  = require("webpack");

import {
	PACK_MODE,
	PROJECT_ROOT,
	GAME_SERVERS,
	__BaseConfig,
} from "./webpack.base.config";

import nodeExternals        = require("webpack-node-externals");
import HtmlPlugin           = require("html-webpack-plugin");
import CspHtmlPlugin        = require("csp-html-webpack-plugin");
import MiniCssExtractPlugin = require("mini-css-extract-plugin");
import CssMinimizerPlugin   = require("css-minimizer-webpack-plugin");
import CompressionPlugin    = require("compression-webpack-plugin");
type SplitChunksOpts = Exclude<NonNullable<webpack.Configuration["optimization"]>["splitChunks"], undefined | false>["cacheGroups"];


const WEB_MODULE_RULES = (): Array<webpack.RuleSetRule> => { return [{
	test: /\.css$/,
	issuer: { not: [/\.m\.css/] },
	use: [{
		loader: MiniCssExtractPlugin.loader, options: {}
	},{
		loader: "css-loader", options: {
			modules: {
				auto: /\.m\.css$/,
				//localIdentName: "[name]_[local]_[hash:base64:5]",
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
 */
export const CLIENT_CONFIG = __BaseConfig("client"); {
	const config  = Object.assign(CLIENT_CONFIG, <Partial<webpack.Configuration>>{
		target: ["web", "es2017"],
		entry: {
			"css-common": {
				import: "./src/style/common.css",
			},
			"index": {
				import: "./src/client/index.ts",
				dependOn: "css-common",
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
	config.optimization!.minimizer = ["...", new CssMinimizerPlugin({
		minimizerOptions: { preset: ["default", { discardComments: {}, }] }
	})];
	Object.assign((config.optimization!.splitChunks as any).cacheGroups, <SplitChunksOpts>{
		"game-css": {
			test: /src[/\\]base[/\\].*\.css$/,
			name: "game-css", chunks: "all", priority: 10,
			reuseExistingChunk: true, enforce: true,
		},
	});
	const htmlPluginOptions: HtmlPlugin.Options = {
		template: path.resolve(PROJECT_ROOT, "src/client/index.ejs"),
		favicon: "./assets/favicon.png",
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