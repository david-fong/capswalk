"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const path = require("path");
const webpack = require("webpack");

const { MODE, PROJECT_ROOT, GAME_SERVERS} = require("./webpack.base.config");
const nodeExternals = require("webpack-node-externals");

const HtmlPlugin = require("html-webpack-plugin");
const CspHtmlPlugin = require("csp-html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
/** @typedef {Exclude<NonNullable<webpack.Configuration["optimization"]>["splitChunks"], undefined | false>["cacheGroups"]} SplitChunksOpts */

/** @type {() => Array<webpack.RuleSetRule>} */
const WEB_MODULE_RULES = () => {
	return [{
			test: /\.css$/,
			issuer: { not: [/\.m\.css/] },
			use: [{
					loader: MiniCssExtractPlugin.loader, options: {}
				}, {
					loader: "css-loader", options: {
						modules: {
							auto: /\.m\.css$/,
						},
					},
				}],
		}, {
			// https://webpack.js.org/loaders/file-loader/
			test: /\.(png|svg|jpe?g|gif)$/,
			issuer: /\.css$/,
			use: [(() => {
					/** @type {(url: string, resourcePath: string, context: string) => string} */
					const pathFunc = (url, resourcePath, context) => {
						return path.relative(context, resourcePath).replace(/\\/g, "/");
					};
					return {
						loader: "file-loader",
						options: {
							context: PROJECT_ROOT("assets"),
							//name: "[name].[ext]",
							outputPath: pathFunc,
							publicPath: pathFunc,
						},
					};
				})()],
		},];
};
/**
 */
exports.CLIENT_CONFIG = __BaseConfig("client");
{
	/** @type {webpack.Configuration} */
	const _assign = {
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
			importType: "root",
		})],
	}
	const config = Object.assign(exports.CLIENT_CONFIG, _assign);
	config.resolve.modules.push(PROJECT_ROOT()); // for requiring assets.
	config.module.rules.push(...WEB_MODULE_RULES());
	Object.assign(config.resolve.alias, {});
	config.optimization.minimizer = ["...", new CssMinimizerPlugin({
			minimizerOptions: { preset: ["default", { discardComments: {}, }] }
		})];
	Object.assign(config.optimization.splitChunks.cacheGroups, /** @type {SplitChunksOpts} */{
		"game-css": {
			test: /src[/\\]base[/\\].*\.css$/,
			name: "game-css", chunks: "all", priority: 10,
			reuseExistingChunk: true, enforce: true,
		},
	});
	/** @type {HtmlPlugin.Options} */
	const htmlPluginOptions = {
		template: PROJECT_ROOT("src/client/index.ejs"),
		favicon: "./assets/favicon.png",
		inject: false,
		templateParameters: (compilation, assets, assetTags, options) => {
			return {
				compilation, webpackConfig: compilation.options,
				htmlWebpackPlugin: { tags: assetTags, files: assets, options, },
				// Custom HTML templates for index.ejs:
				wellKnownGameServers: require(PROJECT_ROOT("servers.json")),
			};
		},
	};
	config.plugins.push(
		new HtmlPlugin(htmlPluginOptions),
		// new HtmlPlugin(Object.assign({}, htmlPluginOptions, <HtmlPlugin.Options>{
		// 	chunks: [],
		// 	filename: "404.html",
		// })),
		new CspHtmlPlugin({
			"default-src": ["'self'"],
			"script-src": ["'self'"], "style-src": ["'self'"],
			"child-src": "'none'", "object-src": "'none'", "base-uri": "'none'",
			"connect-src": ["'self'", ...GAME_SERVERS.map((origin) => `wss://${origin}/ws/`)],
			"form-action": "'none'",
		}, {
			hashingMethod: "sha256",
			hashEnabled: { "script-src": true, "style-src": false },
			nonceEnabled: { "script-src": false, "style-src": false },
		}), new MiniCssExtractPlugin({
			filename: "[name].css",
			chunkFilename: "chunk/[name].css",
			attributes: { disable: "true" },
		}),
	);
	if (MODE.prod) { config.plugins.push(
		new CompressionPlugin({
			filename: "[path][base].br[query]",
			algorithm: "brotliCompress",
			test: /\.(js|css|html|svg)$/,
			compressionOptions: { params: {} /* https://brotli.org/encode.html */ },
			threshold: 10240,
			minRatio: 0.8,
		}),
	);}
}
