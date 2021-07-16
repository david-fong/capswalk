"use strict";
const path = require("path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");

const {
	MODE,
	PROJECT_ROOT,
	__BaseConfig,
	GAME_SERVERS,
} = require("./webpack.base.config");

const HtmlPlugin = require("html-webpack-plugin");
const CspHtmlPlugin = require("csp-html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
/** @typedef {Exclude<NonNullable<webpack.Configuration["optimization"]>["splitChunks"], undefined | false>["cacheGroups"]} SplitChunksOpts */

/** @type {() => webpack.RuleSetRule[]} */
const WEB_MODULE_RULES = () => Object.freeze([{
	test: /\.css$/,
	issuer: { not: [/\.m\.css$/] }, // <- solves some output duplication issues
	use: [{
		loader: MiniCssExtractPlugin.loader, options: {}
	}, {
		loader: "css-loader", options: {
			modules: {
				auto: /\.m\.css$/,
				localIdentName: MODE.dev ? "[local]_[hash:base64:3]" : "[hash:base64]"
			},
		},
	}],
},{
	test: /\.(png|svg|jpe?g|gif)$/,
	type: "asset",
}]);
/**
 */
exports.CLIENT_CONFIG = __BaseConfig("client");
{
	/** @type {webpack.Configuration} */
	const _assign = {
		target: ["web", "es2017"],
		entry: {
			"css-common": {
				import: "./src/client/style/common.css",
			},
			"index": {
				import: "./src/client/index.ts",
				dependOn: "css-common",
			},
		},
		externals: [nodeExternals({
			importType: "root",
		})],
	};
	const config = Object.assign(exports.CLIENT_CONFIG, _assign);
	config.resolve.modules.push(PROJECT_ROOT()); // for requiring assets.
	config.module.rules.push(...WEB_MODULE_RULES());
	Object.assign(config.resolve.alias, {});

	config.optimization.minimizer = ["...", new CssMinimizerPlugin({
		minimizerOptions: { preset: ["default", { discardComments: {}, }] }
	})];
	{
		/** @type {SplitChunksOpts} */
		const opts = {
			"game-css": {
				test: /src[/\\]client[/\\]game[/\\].*\.css$/,
				name: "game-css", chunks: "all", priority: 10,
				reuseExistingChunk: true, enforce: true,
			},
		};
		Object.assign(config.optimization.splitChunks.cacheGroups, opts);
	}
	/** @type {HtmlPlugin.Options} */
	const htmlPluginOptions = {
		template: PROJECT_ROOT("src/client/index.ejs"),
		favicon:  PROJECT_ROOT("src/client/favicon.png"),
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
		new CspHtmlPlugin({
			"default-src": ["'self'"],
			"script-src":  ["'self'"],
			"style-src":   ["'self'", "https://fonts.googleapis.com"],
			"img-src":     ["'self'", "https://twemoji.maxcdn.com"],
			"child-src": "'none'", "object-src": "'none'", "base-uri": "'none'",
			"connect-src": ["'self'", ...GAME_SERVERS.map((origin) => `wss://${origin}/ws/`)],
			"form-action": "'none'", "font-src": ["'self'", "https://fonts.gstatic.com"] },{
			hashingMethod: "sha256",
			hashEnabled:  { "script-src": true,  "style-src": false },
			nonceEnabled: { "script-src": false, "style-src": false },
		}),
		new MiniCssExtractPlugin({
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
	); }
}
