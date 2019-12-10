const path = require('path');
import * as webpack from 'webpack';

/**
 * https://www.typescriptlang.org/docs/handbook/react-&-webpack.html
 * https://webpack.js.org/configuration/configuration-languages/#typescript
 */
const config: webpack.Configuration = {
    // https://webpack.js.org/configuration/entry-context/#context
    context: __dirname,
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [ '.ts', '.tsx', '.js', ],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
};

module.exports = config;
