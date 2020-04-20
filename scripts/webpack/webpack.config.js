"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const HtmlPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const PACK_MODE = "development";
exports.PROJECT_ROOT = path.resolve(__dirname, "../..");
const WATERMARK = "/**\n * " + [
    "SnaKey by David Fong",
    "https://github.com/david-fong/SnaKey-NTS",
].join("\n * ") + "\n */";
const BASE_PLUGINS = [
    new webpack.ProgressPlugin((pct, msg, moduleProgress, activeModules, moduleName) => {
        console.log(`[${Math.floor(pct * 100).toString().padStart(3)}% ]`, (msg === "building") ? msg : msg.padEnd(45), (msg === "building") ? moduleProgress.padStart(15) : (moduleProgress || ""), (moduleName || "")
            .replace(exports.PROJECT_ROOT, "...")
            .replace(exports.PROJECT_ROOT, "...")
            .replace(exports.PROJECT_ROOT, "...")
            .replace(path.join("node_modules", "ts-loader", "index.js"), "ts-loader"));
    }),
];
const MODULE_RULES = [{
        test: /\.ts$/,
        use: {
            loader: "ts-loader",
            options: {
                projectReferences: true,
                compilerOptions: {
                    emitDeclarationOnly: true,
                },
                transpileOnly: true,
                experimentalWatchApi: true,
            },
        },
        exclude: /node_modules/,
    }, {
        test: /\.css$/,
        use: [{
                loader: MiniCssExtractPlugin.loader,
            }, "css-loader",],
    },];
const BaseConfig = () => {
    return {
        mode: PACK_MODE,
        cache: true,
        stats: {
            cached: false,
            warningsFilter: [/export .* was not found in/,],
        },
        context: exports.PROJECT_ROOT,
        entry: {},
        devtool: "source-map",
        plugins: [...BASE_PLUGINS,],
        resolve: {
            extensions: [".ts",],
            modules: [path.resolve(exports.PROJECT_ROOT, "src", "base"),],
        },
        watchOptions: {
            ignored: ["node_modules",],
        },
        module: { rules: MODULE_RULES, },
        optimization: {
            splitChunks: {
                chunks: "initial",
                minChunks: 1,
            },
        },
        output: {
            path: path.resolve(exports.PROJECT_ROOT, "dist"),
            publicPath: "dist",
            filename: "[name]/index.js",
            sourcePrefix: WATERMARK,
            pathinfo: false,
        },
    };
};
const webBundleConfig = BaseConfig();
{
    const config = webBundleConfig;
    config.name = "src-web";
    config.target = "web";
    config.externals = [];
    const makeHtmlPluginArgs = (entryName) => {
        return {
            template: "./index.ejs",
            favicon: "assets/favicon.ico",
            filename: `${entryName}/index.html`,
            base: "../..",
            scriptLoading: "defer",
            inject: false,
            chunks: [
                entryName,
            ],
            chunksSortMode: "auto",
            templateParameters: (compilation, assets, assetTags, options) => {
                return {
                    compilation,
                    webpackConfig: compilation.options,
                    htmlWebpackPlugin: {
                        tags: assetTags,
                        files: assets,
                        options
                    },
                };
            },
        };
    };
    ["client",].forEach((entryName) => {
        config.entry[entryName] = `./src/${entryName}/index.ts`;
        const ghPages = makeHtmlPluginArgs(entryName);
        ghPages.filename = "../index.html";
        ghPages.base = ".";
        config.plugins.push(new HtmlPlugin(ghPages));
        config.plugins.push(new MiniCssExtractPlugin({
            filename: "index.css"
        }));
    });
}
const NODE_CONFIG = (config) => {
    config.target = "node";
    config.resolve.modules.push("node_modules");
    config.resolve.extensions.push(".js");
    config.externals = fs.readdirSync(path.resolve(exports.PROJECT_ROOT, "node_modules"));
};
const nodeBundleConfig = BaseConfig();
{
    const config = nodeBundleConfig;
    config.name = "src-node";
    NODE_CONFIG(config);
    ["server",].forEach((name) => {
        config.entry[name] = `./src/${name}/index.ts`;
    });
}
const testBundleConfig = BaseConfig();
{
    const config = testBundleConfig;
    config.name = "test";
    config.resolve.modules = [
        path.resolve(exports.PROJECT_ROOT, "src", "base"),
        path.resolve(exports.PROJECT_ROOT, "src"),
        exports.PROJECT_ROOT,
    ];
    NODE_CONFIG(config);
    config.output.path = path.resolve(exports.PROJECT_ROOT, "dist", "test");
    ["lang",].forEach((name) => {
        config.entry[name] = `./test/${name}/index.ts`;
    });
}
module.exports = [
    webBundleConfig,
];
