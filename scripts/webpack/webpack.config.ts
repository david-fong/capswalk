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
const PROJECT_ROOT = path.resolve(__dirname, "../..");

const BASE_PLUGINS = (): ReadonlyArray<Readonly<webpack.WebpackPluginInstance>> => { return [
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
    new webpack.WatchIgnorePlugin({ paths: [
        /\.js$/,
        /\.d\.ts$/,
    ]}),
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
                //noEmit: true,
            },
            // https://github.com/TypeStrong/ts-loader#faster-builds
            transpileOnly: true,
            experimentalWatchApi: true,
            experimentalFileCaching: true,
        },
    },
    exclude: /node_modules/,
}, ];};
const WEB_MODULE_RULES = (): Array<webpack.RuleSetRule> => { return [{
    test: /\.css$/,
    use: [{
        loader: MiniCssExtractPlugin.loader,
        options: {}
    },{
        loader: "css-loader",
        options: {
            modules: false,
        },
    }],
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
}, ];}

/**
 * # Base Config
 *
 * Everything that builds off of this will need to add the `entry` field.
 *
 * Important implementation note: make sure helpers return completely new
 * instances each time. BASE_PLUGINS() and MODULE_RULES().
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
    name: distSubFolder,
    stats: { /* https://webpack.js.org/configuration/stats/ */
        children: false,
        colors: true,
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
    devtool: (PACK_MODE === "production")
        ? "nosources-source-map"
        : "eval-cheap-source-map",
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
        splitChunks: {
            //chunks: "all",
        },
    },
    watchOptions: {
        ignored: [ "node_modules", ],
    },
}; };





/**
 * ## Web Bundles
 */
const CLIENT_CONFIG = __BaseConfig("client"); {
    const config  = CLIENT_CONFIG;
    config.target = "web";
    config.entry["index"] = `./src/client/index.ts`;
    config.externals = [ nodeExternals({
        allowlist: ["tslib"],
        importType: "root",
    }), ],
    config.resolve.modules!.push(path.resolve(PROJECT_ROOT)); // for requiring assets.
    config.module!.rules!.push(...WEB_MODULE_RULES());
    // config.resolve.alias = config.resolve.alias || {
    //     "socket.io-client": "socket.io-client/dist/socket.io.slim.js",
    // };
    config.plugins.push(
        new HtmlPlugin({
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
        }),
        new MiniCssExtractPlugin({
            filename: "_barrel.css",
            chunkFilename: "chunk/[name].css",
        }) as webpack.WebpackPluginInstance, // TODO.build remove this when https://github.com/webpack-contrib/mini-css-extract-plugin/pull/594
        new CopyWebpackPlugin({ patterns: [{
            from: `node_modules/socket.io-client/dist/socket.io.${(
                PACK_MODE === "production" ? "slim" : "dev" // TODO.build see https://github.com/socketio/socket.io-client/releases/tag/3.0.0-rc1 breaking changes
            )}.js` + "*", // <- glob to include sourcemap file.
            to: "vendor/socket.io.[ext]",
            flatten: true,
        }],}),
    );
    if (PACK_MODE === "production") {
        config.plugins.push(new OptimizeCssAssetsPlugin({
            cssProcessorPluginOptions: {
                preset: ["default", { discardComments: { removeAll: true, },},],
            },
        }));
    }
}



/**
 */
const __applyCommonNodeConfigSettings = (config: ReturnType<typeof __BaseConfig>): void => {
    config.target = "node";
    // alternative to below: https://www.npmjs.com/package/webpack-node-externals
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
        : "eval-cheap-module-source-map";
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