import path = require("path");
import fs = require("fs");

import webpack = require("webpack");
import HtmlPlugin = require("html-webpack-plugin");

// https://webpack.js.org/plugins/mini-css-extract-plugin/
import MiniCssExtractPlugin = require("mini-css-extract-plugin");
import OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");

// Note: if I ever add this back, I'll need to look into how to make
// sure it doesn't clean away things from separate configs (See notes
// below on why I export multiple configurations).
// import clean = require("clean-webpack-plugin");

// https://github.com/TypeStrong/ts-loader#loader-options
import type * as tsloader from "ts-loader/dist/interfaces";

type Require<T, K extends keyof T> = T & Pick<Required<T>, K>;



/**
 * Externalized definition (for convenience of toggling).
 */
const PACK_MODE = (process.env.NODE_ENV) as webpack.Configuration["mode"];

export const PROJECT_ROOT = path.resolve(__dirname, "../..");

const BASE_PLUGINS: ReadonlyArray<Readonly<webpack.Plugin>> = [
    // new webpack.ProgressPlugin((pct, msg, moduleProgress?, activeModules?, moduleName?) => {
    //     console.log(
    //         `[${Math.floor(pct * 100).toString().padStart(3)}% ]`,
    //         (msg === "building") ? msg : msg.padEnd(45),
    //         (msg === "building") ? moduleProgress!.padStart(15) : (moduleProgress || ""),
    //         (moduleName || "")
    //         .replace(new RegExp(PROJECT_ROOT.replace(/\\/g, "\\\\"), "g"), ":")
    //         .replace(path.join("node_modules","ts-loader","index.js"), "ts-loader")
    //         .replace(path.join("node_modules","css-loader","dist","cjs.js"), "css-loader"),
    //     );
    // }),
    // new webpack.WatchIgnorePlugin([
    //     /\.js$/,
    //     /\.d\.ts$/,
    // ]),
];

/**
 * https://webpack.js.org/loaders/
 */
const MODULE_RULES: Array<webpack.RuleSetRule> = [{
    // With ts-loader@7.0.0, you need to set:
    // options.compilerOptions.emitDeclarationsOnly: false
    // options.transpileOnly: false
    test: /\.ts$/,
    use: {
        loader: "ts-loader",
        options: <tsloader.LoaderOptions>{
            projectReferences: true,
            compilerOptions: {
                emitDeclarationOnly: true,
                //noEmit: true,
            },
            // https://github.com/TypeStrong/ts-loader#faster-builds
            transpileOnly: true,
            experimentalWatchApi: true,
        },
    },
    exclude: /node_modules/,
}, {
    test: /\.css$/,
    use: ((): webpack.RuleSetUseItem[] => {
        const retval: webpack.RuleSetUse = [ "css-loader", ];
        //if (PACK_MODE !== "development") {
            retval.unshift({
                loader: MiniCssExtractPlugin.loader,
            });
        //}
        return retval;
    })(),
}, ];

/**
 * # Base Config
 *
 * The way my project is set up as a single node package, I need to
 * export an array of configs. Note that I don't bundle any node
 * modules, but if if do, there are tricky things that can be solved
 * by adding `node: { "fs": "empty", "net": "empty", },`
 *
 * Everything that builds off of this will need to add the `entry` field.
 *
 * **Important**: Make sure all referenced objects are only accessible
 * via pure producers. Otherwise, mutations in one bundle's config will
 * propagate to all the following config definitions.
 *
 * ## Help Links
 *
 * - https://www.typescriptlang.org/docs/handbook/react-&-webpack.html
 * - https://webpack.js.org/configuration/configuration-languages/#typescript
 * - https://github.com/TypeStrong/ts-loader#loader-options
 *
 * @returns A standalone ("deep-copy") basic configuration.
 */
const BaseConfig: () => Require<webpack.Configuration,
"entry" | "plugins" | "resolve" | "output"> = () => { return {
    mode: PACK_MODE,
    // https://webpack.js.org/guides/caching/
    // https://webpack.js.org/configuration/other-options/#cache
    cache: true,
    stats: {
        // https://webpack.js.org/configuration/stats/
        //warningsFilter: [ /export .* was not found in/, ],
    },

    context: PROJECT_ROOT, // https://webpack.js.org/configuration/entry-context/#context
    entry: { /* Left to each branch config */ },
    devtool: <webpack.Options.Devtool>(PACK_MODE === "production")
        ? "nosources-source-map" : "eval-source-map",
    plugins: [ ...BASE_PLUGINS, ],
    resolve: {
        extensions: [ ".ts", ], // ".json", ".tsx",
        modules: [ path.resolve(PROJECT_ROOT, "src", "base"), ], // match tsconfig.baseUrl
    },
    watchOptions: {
        ignored: [ "node_modules", ],
    },
    module: { rules: MODULE_RULES, },
    optimization: {
        // runtimeChunk: {
        //     name: entrypoint => `${entrypoint.name}/runtime`,
        // } as webpack.Options.RuntimeChunkOptions,
        //mergeDuplicateChunks: true,
    },
    output: {
        path:           path.resolve(PROJECT_ROOT, "dist"),
        publicPath:     "dist/", // lol webpack fails without the trailing slash.
        filename:       "[name]/index.js",
        chunkFilename:  "[name]/index.js",
        library:        "snakey3",
        pathinfo: false, // don't need it. suppression yields small performance gain.
    },
}; };





/**
 * ## Web Bundles
 *
 * socket.io-client will be bundled as well.
 *
 * - `target: "web",`. This is implied, but here, explicitness helps me learn.
 * - `externals: [ nodeExternals(), ],` or something like `[ "socket.io-client", ]`
 * - appropriate plugin entries for the index.html file.
 */
const webBundleConfig = BaseConfig(); {
    const config  = webBundleConfig;
    config.target = "web";
    config.name   = "src-web";
    config.externals = [ ]; // "socket.io-client"

    const htmlPluginArgs: HtmlPlugin.Options = {
        template:   "./index.ejs",
        filename:   "../index.html",
        base:       ".", // must play nice with path configs.
        favicon:    "./assets/favicon.ico",
        scriptLoading: "defer",
        inject: false, // (I specify where each injection goes in the template).
        templateParameters: (compilation, assets, assetTags, options) => { return {
            compilation, webpackConfig: compilation.options,
            htmlWebpackPlugin: { tags: assetTags, files: assets, options, },
            // Custom HTML templates for index.ejs:
            // "extraScripts": [],
        }; },
        //hash: true,
    };
    config.entry["client"] = `./src/client/index.ts`;
    config.plugins.push(new HtmlPlugin(htmlPluginArgs));
    config.plugins.push(new MiniCssExtractPlugin({
        filename: "index.css",
    }));
    if (PACK_MODE === 'production') {
        config.plugins.push(new OptimizeCssAssetsPlugin({
            cssProcessorPluginOptions: {
                preset: ['default', { discardComments: { removeAll: true, },},],
            },
        }));
    }
}



/**
 * ## Basic node configuration:
 *
 * - `target: "node"`. This should mean that node modules are not bundled.
 * - `resolve.modules.push("node_modules")`
 * - `externals: fs.readdirsync(path.resolve(PROJECT_ROOT, "node_modules"))`
 *
 * @param config -
 */
const NODE_CONFIG = (config: ReturnType<typeof BaseConfig>): void => {
    config.target = "node";
    config.resolve.modules!.push("node_modules");
    config.resolve.extensions!.push(".js");
    // alternative to below: https://www.npmjs.com/package/webpack-node-externals
    config.externals = fs.readdirSync(path.resolve(PROJECT_ROOT, "node_modules"));
};

/**
 * ## Node Bundles
 */
const nodeBundleConfig = BaseConfig(); {
    const config = nodeBundleConfig;
    config.name = "src-node";
    NODE_CONFIG(config);
    (<const>[ "server", ]).forEach((name) => {
        config.entry[name] = `./src/${name}/index.ts`;
    });
}

/**
 * ## Test Bundles
 *
 * See the node settings.
 *
 * Emit all test bundles under a single folder.
 */
const testBundleConfig = BaseConfig(); {
    const config = testBundleConfig;
    config.name = "test";
    config.resolve.modules = [
        path.resolve(PROJECT_ROOT, "src", "base"),
        path.resolve(PROJECT_ROOT, "src"),
        PROJECT_ROOT,
    ];
    NODE_CONFIG(config);
    config.output.path = path.resolve(PROJECT_ROOT, "dist", "test");
    (<const>[ "lang", ]).forEach((name) => {
        config.entry[name] = `./test/${name}/index.ts`;
    });
}



module.exports = [
    webBundleConfig,
    // TODO.build Uncomment these pack configs when we get to using them.
    //nodeBundleConfig,
    //testBundleConfig,
];
