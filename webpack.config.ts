import path = require("path");

import webpack = require("webpack");
import HtmlPlugin = require("html-webpack-plugin");

// Note: if I ever add this back, I'll need to look into how to make
// sure it doesn't clean away things from separate configs (See notes
// below on why I export multiple configurations).
// import clean = require("clean-webpack-plugin");

// https://www.npmjs.com/package/webpack-node-externals
import nodeExternals = require("webpack-node-externals");

// only used for type-hinting.
// omitted from transpilation output.
// https://github.com/TypeStrong/ts-loader#loader-options
import * as tsloader from "ts-loader/dist/interfaces";



/**
 * Relative paths in any config fields will resolve off the parent
 * directory of this file.
 */
const PROJECT_ROOT = __dirname;

const WATERMARK = "/**\n * " + [
      "SnaKey by David Fong",
      "https://github.com/david-fong/SnaKey-NTS",
].join("\n * ") + "\n */";

const BasePlugins: () => Array<webpack.Plugin> = () => {return [
    new webpack.ProgressPlugin((pct, msg, moduleProgress?, activeModules?, moduleName?) => {
        console.log(
            `[${Math.floor(pct * 100).toString().padStart(3)}% ]`,
            (msg === "building") ? msg : msg.padEnd(45),
            (msg === "building") ? moduleProgress!.padStart(15) : (moduleProgress || ""),
            (moduleName || "").replace(PROJECT_ROOT, "...").replace(PROJECT_ROOT, "..."),
        );
    }),
]; };

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
 * as producers. Otherwise, mutations in one bundle configurations will
 * propagate to all following config definitions.
 * 
 * ## Web Bundles:
 * 
 * This includes the homepage, 
 * 
 * - `target: "web",`. This is implied, but here, explicitness helps me learn.
 * - `externals: [ nodeExternals(), ],` or something like `[ "socket.io-client", ]`
 * - appropriate plugin entries for the index.html file.
 * 
 * ## Node Bundles:
 * 
 * - `target: "node"`. This should mean that node modules are not bundled.
 * - `resolve.modules.push("node_modules")`
 * - `resolve.extensions.push(".js")`
 * 
 * ## Help Links
 * 
 * - https://www.typescriptlang.org/docs/handbook/react-&-webpack.html
 * - https://webpack.js.org/configuration/configuration-languages/#typescript
 * - https://github.com/TypeStrong/ts-loader#loader-options
 * 
 * @returns A standalone ("deep-copy") basic configuration.
 */
const BaseConfig: () => webpack.Configuration = () => { return {
    mode: "development",
    target: "node",
    externals: [ nodeExternals(), ],
    // cache: true, // https://webpack.js.org/guides/caching/
    stats: { }, // https://webpack.js.org/configuration/stats/

    context: PROJECT_ROOT, // https://webpack.js.org/configuration/entry-context/#context
    devtool: "source-map",
    plugins: BasePlugins(),
    resolve: {
        extensions: [ ".ts", ], // ".json", ".tsx", 
        modules: [ PROJECT_ROOT, ], // match tsconfig.baseUrl
    },
    module: {
        rules: [ // https://webpack.js.org/loaders/
            {
                test: /\.tsx?$/,
                use: {
                    loader: "ts-loader",
                    options: {
                    } as tsloader.LoaderOptions,
                } as webpack.RuleSetLoader,
                exclude: /node_modules/,
            },
            // TODO: look into need for html loader
        ],
    },
    output: {
        path: path.resolve(PROJECT_ROOT, "dist"),
        filename: "[name]/index.js",
        sourcePrefix: WATERMARK,
    },
}; };



/**
 * Add entrypoints for webpages:
 */
const webConfig = BaseConfig();
(<const>[ /* TODO: "homepage", */ "offline", "client", ]).forEach((name) => {
    webConfig.entry[name] = `./src/${name}/index.ts`;
    // entry[`${name}_body`] = `./src/${name}/body.html`;
    webConfig.plugins.push(
        new HtmlPlugin({
            template: "./src/base/index.html",
            filename: `${name}/index.html`,
            chunks: [ name, /*`${name}_body`,*/ ],
            hash: true,
        })
    );
});



module.exports = [ webConfig, ];
