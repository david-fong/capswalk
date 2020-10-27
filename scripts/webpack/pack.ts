import path    = require("path");
import webpack = require("webpack");
import configs = require("./webpack.config");

// This way I don't need to install webpack-cli,
// which pulls in hundreds of packages for some reason.
// https://webpack.js.org/api/node/
(configs as webpack.Configuration[]).forEach((config) => {
    const compiler = webpack(config);
    compiler.run((err, stats) => {
        console.log(`\n\n${"=".repeat(32)} ${config.name!.toUpperCase()} ${"=".repeat(32)}\n`);
        if (err) {
            console.error(err.stack || err);
            if (err["details"]) {
                console.error(err["details"]);
            }
            return;
        }
        console.log(stats?.toString(config.stats));
        console.log();
    });
    compiler.close((err, result) => {});
});