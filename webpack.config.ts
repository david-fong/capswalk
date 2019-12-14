import path = require("path");

import webpack = require("webpack");
import HtmlPlugin = require("html-webpack-plugin");
import clean = require("clean-webpack-plugin");

// only used for type-hinting.
// omitted from transpilation output.
import * as tsloader from "ts-loader/dist/interfaces";


/**
 * Relative paths resolve based off the parent directory of this file.
 */
const context = __dirname;

const webpageEntry = <const>[
    // "homepage"
    "offline",
    "server",
    //"client",
];

/**
 * # Entrypoints
 */
const entry: webpack.Entry = {
    "test": "./test/index.ts",
    // "test/lang"
};
const plugins: Array<webpack.Plugin> = [
    new clean.CleanWebpackPlugin(),
    new webpack.ProgressPlugin(),
];

// Add entrypoints for webpages:
webpageEntry.forEach((name) => {
    entry[name] = `./src/${name}/index.ts`;
    //entry[`${name}_body`] = `./src/${name}/body.html`;
    plugins.push(
        new HtmlPlugin({
            template: "./src/base/index.html",
            filename: `${name}/index.html`,
            chunks: [
                name,
                //`${name}_body`,
            ],
            hash: true,
        })
    );
});



/**
 * https://www.typescriptlang.org/docs/handbook/react-&-webpack.html
 * https://webpack.js.org/configuration/configuration-languages/#typescript
 * 
 * https://github.com/TypeStrong/ts-loader#loader-options
 */
const config: webpack.Configuration = {
    mode: "development",
    node: {
        "fs": "empty",
        "uws": "empty",
        "net": "empty",
    },
    cache: true, // https://webpack.js.org/guides/caching/
    stats: {
        // https://webpack.js.org/configuration/stats/
        colors: true,
    },
    optimization: {
        moduleIds: "hashed",
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                },
            },
        },
    },


    // https://webpack.js.org/configuration/entry-context/#context
    context,
    entry,
    devtool: "source-map",
    resolve: {
        extensions: [ ".ts", ".json", ".tsx", ".js", ],
        modules: [ ".", "./node_modules", ],
        // Note: if the ./src/ -based imports were to lose the "src/"
        // prefixes for brevity, then we would need to add "src" after ".".
        // If we did the same for test module imports, we would need to add
        // "test" before or after "src" to the above list and make sure to
        // prefix "src/" when importing source modules. Would also have to
        // use the "paths" field to tsconfig.json to help typescript know
        // what we are doing.
    },
    module: {
        rules: [
            {
                // https://github.com/TypeStrong/ts-loader#loader-options
                test: /\.tsx?$/,
                use: {
                    loader: "ts-loader",
                    options: {
                    } as tsloader.LoaderOptions,
                } as webpack.RuleSetLoader,
                exclude: /node_modules/,
            },
            // TODO: look into need for html loader
        ] as Array<webpack.RuleSetRule>,
    },
    plugins,
    output: {
        path: path.resolve(context, "dist"),
        filename: "[name]/index.[contentHash].js",
    },
};

module.exports = config;
