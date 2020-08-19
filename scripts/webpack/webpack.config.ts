import path     = require("path");
import webpack  = require("webpack");

// https://github.com/TypeStrong/ts-loader#loader-options
import type * as tsloader from "ts-loader/dist/interfaces";

import nodeExternals = require("webpack-node-externals");
import CopyWebpackPlugin = require("copy-webpack-plugin");
import HtmlPlugin = require("html-webpack-plugin");
import MiniCssExtractPlugin = require("mini-css-extract-plugin");
import OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");

type Require<T, K extends keyof T> = T & Pick<Required<T>, K>;


/**
 * Externalized definition (for convenience of toggling).
 */
const PACK_MODE = (process.env.NODE_ENV) as webpack.Configuration["mode"];

export const PROJECT_ROOT = path.resolve(__dirname, "../..");

const BASE_PLUGINS = (): ReadonlyArray<Readonly<webpack.Plugin>> => { return [
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
]};

/**
 * https://webpack.js.org/loaders/
 */
const MODULE_RULES = (): Array<webpack.RuleSetRule> => { return [{
    test: /\.(md)$/,
    use: "null-loader",
},{
    // With ts-loader@7.0.0, you need to set:
    // options.compilerOptions.emitDeclarationsOnly: false
    // options.transpileOnly: false
    test: /\.ts$/,
    use: {
        loader: "ts-loader",
        options: <tsloader.LoaderOptions>{
            projectReferences: true,
            compilerOptions: {
                // We need to preserve comments in transpiled output
                // so that magic comments in dynamic imports can be
                // seen by webpack.
                removeComments: false,
                importHelpers: false, // :'(
                // TODO.build get rid of the above line when
                // https://github.com/microsoft/TypeScript/issues/36841
                // is fixed. What an absolute tragedy T^T
                //noEmit: true,
            },
            // https://github.com/TypeStrong/ts-loader#faster-builds
            transpileOnly: true,
            experimentalWatchApi: true,
            experimentalFileCaching: true,
        },
    },
    exclude: /node_modules/,
},{
    test: /\.css$/,
    use: ((): webpack.RuleSetUseItem[] => {
        const retval: webpack.RuleSetUse = [ "css-loader", ];
        retval.unshift({
            loader: MiniCssExtractPlugin.loader,
            options: {
                publicPath: (resourcePath: string, context: string) => {
                    // publicPath is the relative path of the resource to the context
                    // e.g. for ./css/admin/main.css the publicPath will be ../../
                    // while for ./css/main.css the publicPath will be ../
                    // return path.relative(path.dirname(resourcePath), context).replace(/\\/g, "/") + "/";
                },
            }
        });
        return retval;
    })(),
},{
    // https://webpack.js.org/loaders/file-loader/
    test: /\.(png|svg|jpe?g|gif)$/,
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
}, ]};

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
 * Important implementation note: make sure helpers such as
 *
 * ## Help Links
 *
 * - https://www.typescriptlang.org/docs/handbook/react-&-webpack.html
 * - https://webpack.js.org/configuration/configuration-languages/#typescript
 * - https://github.com/TypeStrong/ts-loader#loader-options
 *
 * @returns A standalone ("deep-copy") basic configuration.
 */
const __BaseConfig = (distSubFolder: string): Require<webpack.Configuration,
"entry" | "plugins" | "resolve" | "output"> => { return {
    mode: PACK_MODE,
    name: `\n\n${"=".repeat(32)} ${distSubFolder.toUpperCase()} ${"=".repeat(32)}\n`,
    stats: { /* https://webpack.js.org/configuration/stats/ */
        children: false,
    },

    context: PROJECT_ROOT, // https://webpack.js.org/configuration/entry-context/#context
    entry: { /* Left to each branch config */ },
    plugins: [ ...BASE_PLUGINS(), ],
    resolve: {
        extensions: [ ".ts", ".css", ".js", ],
        modules: [
            path.resolve(PROJECT_ROOT, "src", "base"),
            path.resolve(PROJECT_ROOT, "node_modules"),
        ], // match tsconfig.baseUrl
    },
    module: { rules: MODULE_RULES(), },
    // https://webpack.js.org/plugins/source-map-dev-tool-plugin/
    devtool: <webpack.Options.Devtool>(PACK_MODE === "production")
        ? "nosources-source-map"
        : "cheap-eval-source-map",
    output: {
        path:           path.resolve(PROJECT_ROOT, "dist", distSubFolder),
        publicPath:     `dist/${distSubFolder}/`, // need trailing "/".
        filename:       "[name].js",
        chunkFilename:  "chunk/[name].js",
        library:        "snakey3",
        pathinfo: false, // unneeded. minor performance gain.
    },

    // https://webpack.js.org/guides/caching/
    // https://webpack.js.org/configuration/other-options/#cache
    cache: true,
    optimization: {
        // runtimeChunk: {
        //     name: entrypoint => `${entrypoint.name}/runtime`,
        // } as webpack.Options.RuntimeChunkOptions,
        //mergeDuplicateChunks: true,
    },
    watchOptions: {
        ignored: [ "node_modules", ],
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
const CLIENT_CONFIG = __BaseConfig("client"); {
    const config  = CLIENT_CONFIG;
    config.target = "web";

    const htmlPluginArgs: HtmlPlugin.Options = {
        template:   "./index.ejs",
        filename:   path.resolve(PROJECT_ROOT, "index.html"),
        base:       ".", // must play nice with path configs.
        favicon:    "./assets/favicon.png",
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
    config.entry["index"] = `./src/client/index.ts`;
    config.externals = [ nodeExternals({
        allowlist: ["tslib"],
        importType: "root",
    }), ],
    config.resolve.modules!.push(path.resolve(PROJECT_ROOT)); // for requiring assets.
    // config.resolve.alias = config.resolve.alias || {
    //     "socket.io-client": "socket.io-client/dist/socket.io.slim.js",
    // };
    config.plugins.push(new HtmlPlugin(htmlPluginArgs));
    config.plugins.push(new MiniCssExtractPlugin({
        filename: "_barrel.css",
        chunkFilename: "chunk/[name].css",
    }));
    config.plugins.push(new CopyWebpackPlugin({ patterns: [{
        from: "node_modules/socket.io-client/dist/socket.io.js" + "*",
        to: "vendor/",
        flatten: true,
    }],}));
    if (PACK_MODE === "production") {
        config.plugins.push(new OptimizeCssAssetsPlugin({
            cssProcessorPluginOptions: {
                preset: ["default", { discardComments: { removeAll: true, },},],
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
const __applyCommonNodeConfigSettings = (config: ReturnType<typeof __BaseConfig>): void => {
    config.target = "node";
    // alternative to below: https://www.npmjs.com/package/webpack-node-externals
    config.externals = [ nodeExternals(), ],
    config.resolve.extensions!.push(".js");
    config.node = {
        __filename: false,
        __dirname: false,
        global: false,
    };
};

/**
 * ## Node Bundles
 */
const SERVER_CONFIG = __BaseConfig("server"); {
    const config = SERVER_CONFIG;
    __applyCommonNodeConfigSettings(config);
    config.entry["index"] = `./src/server/index.ts`;
}

/**
 * ## Test Bundles
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
    // TODO.build Uncomment these pack configs when we get to using them.
    SERVER_CONFIG,
    //TEST_CONFIG,
];
