import path = require("path");
import fs = require("fs");

import webpack = require("webpack");
import HtmlPlugin = require("html-webpack-plugin");

// Note: if I ever add this back, I'll need to look into how to make
// sure it doesn't clean away things from separate configs (See notes
// below on why I export multiple configurations).
// import clean = require("clean-webpack-plugin");

// https://www.npmjs.com/package/webpack-node-externals
// import nodeExternals = require("webpack-node-externals");

// https://github.com/TypeStrong/ts-loader#loader-options
import type * as tsloader from "ts-loader/dist/interfaces";

type Require<T, K extends keyof T> = T & Pick<Required<T>, K>;



/**
 * Externalized definition (for convenience of toggling).
 */
const PACK_MODE: webpack.Configuration["mode"] = "development";

/**
 * Relative paths in any config fields will resolve off the parent
 * directory of this file. Note the lack of "../" since this file
 * is configured to send its transpilation output to the root of
 * this project.
 */
export const PROJECT_ROOT = __dirname;

const WATERMARK = "/**\n * " + [
    "SnaKey by David Fong",
    "https://github.com/david-fong/SnaKey-NTS",
].join("\n * ") + "\n */";

/**
 *
 */
const BASE_PLUGINS: ReadonlyArray<Readonly<webpack.Plugin>> = [
    new webpack.ProgressPlugin((pct, msg, moduleProgress?, activeModules?, moduleName?) => {
        console.log(
            `[${Math.floor(pct * 100).toString().padStart(3)}% ]`,
            (msg === "building") ? msg : msg.padEnd(45),
            (msg === "building") ? moduleProgress!.padStart(15) : (moduleProgress || ""),
            (moduleName || "")
            .replace(PROJECT_ROOT, "...")
            .replace(PROJECT_ROOT, "...")
            .replace(path.join("node_modules","ts-loader","index.js"), "ts-loader"),
        );
    }),
    // new webpack.WatchIgnorePlugin([
    //     /\.js$/,
    //     /\.d\.ts$/,
    // ]),
];

/**
 * https://webpack.js.org/loaders/
 */
const MODULE_RULES: Array<webpack.RuleSetRule> = [
    {
        test: /[.]ts$/,
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
    },
    // TODO.learn look into need for html loader
];

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
        cached: false,
        warningsFilter: [ /export .* was not found in/, ],
    },

    context: PROJECT_ROOT, // https://webpack.js.org/configuration/entry-context/#context
    entry: { /* Left to each branch config */ },
    devtool: "source-map",
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
        splitChunks: {
            chunks: "initial",
            minChunks: 1,
        },
    },
    output: {
        path: path.resolve(PROJECT_ROOT, "dist"),
        publicPath: "dist",
        filename: "[name]/index.js",
        sourcePrefix: WATERMARK,
        pathinfo: false, // don't need it. suppression yields small performance gain.
    },
}; };





/**
 * ## Web Bundles
 *
 * - `target: "web",`. This is implied, but here, explicitness helps me learn.
 * - `externals: [ nodeExternals(), ],` or something like `[ "socket.io-client", ]`
 * - appropriate plugin entries for the index.html file.
 */
const webBundleConfig = BaseConfig(); {
    const config = webBundleConfig;
    config.name = "src-web";
    config.target = "web";
    config.externals = [ "socket.io-client", ];

    (<const>[ "offline", "client", ]).forEach((entryName) => {
        config.entry[entryName] = `./src/${entryName}/index.ts`;
        // config.entry[`${name}_body`] = `./src/${name}/body.html`;
        config.plugins.push(new HtmlPlugin({
            template: "./index.ejs",
            filename: `${entryName}/index.html`,
            //favicon: `assets/${name}-favicon.ico`,
            favicon: `assets/favicon.ico`,
            base: "../..", // must play nice with path configs.
            inject: false, // (I specify where each injection goes in the template).
            chunks: [
                entryName,
                //`${name}/runtime`, // see BaseConfig.optimization.runtime
                "client~offline", // see BaseConfig.optimization.splitChunks
            ],
            chunksSortMode: "auto",
            templateParameters: (compilation, assets, assetTags, options) => { return {
                compilation,
                webpackConfig: compilation.options,
                htmlWebpackPlugin: {
                    tags: assetTags,
                    files: assets,
                    options
                },
                "extraScripts": (entryName === "client")
                    ? [ "/socket.io/socket.io.js", ] : [],
            }; },
            //hash: true,
        }));
    });
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
    /* nodeBundleConfig,
    testBundleConfig, */
];
