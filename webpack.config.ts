const path = require("path");

// only used for type-hinting.
// omitted from transpilation output.
import * as webpack from "webpack";
import * as tsloader from "ts-loader/dist/interfaces";

/**
 * https://www.typescriptlang.org/docs/handbook/react-&-webpack.html
 * https://webpack.js.org/configuration/configuration-languages/#typescript
 * 
 * https://github.com/TypeStrong/ts-loader#loader-options
 */
const config: webpack.Configuration = {
    mode: "development",
    // https://webpack.js.org/configuration/entry-context/#context
    context: __dirname,
    entry: {
        "main": "./src/index.ts",
        "test": "./test/index.ts",
    },
    devtool: "source-map",
    resolve: {
        extensions: [ ".ts", ".json", ".tsx", ".js", ],
        modules: [ __dirname, "node_modules", ], // .shift(path.resolve(__dirname, "src"))
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
        ] as Array<webpack.RuleSetRule>,
    },
    output: {
        filename: "bundle-[name].js",
        path: path.resolve(__dirname, "dist"),
    },
};

module.exports = config;
