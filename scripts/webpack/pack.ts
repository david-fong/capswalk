import path    = require("path");
import webpack = require("webpack");
import configs = require("./webpack.config");


// Generate dist/package.json:
const srcPkg    = require("../../package.json");
import distPkg  = require("./templates/package.json");
import fs       = require("fs");
const pkg = distPkg as (typeof distPkg | Partial<typeof srcPkg>); ([
    "name", "author",
    "description", "keywords",
    "version", "dependencies", "repository",
] as ReadonlyArray<keyof typeof srcPkg>).forEach((key) => { pkg[key] = srcPkg[key]; });
pkg["repository"] += "/tree/dist"; // Point to the dist branch.
fs.writeFile(
    path.resolve(__dirname, "../../dist/package.json"),
    JSON.stringify(pkg, undefined, "  "),
    null, (err) => console.error(err),
);
fs.copyFile(
    path.resolve(__dirname, "templates/stage.sh"),
    path.resolve(__dirname, "../../dist/stage.sh"),
    (err) => console.error(err),
);


// This way, I don't need to install webpack-cli,
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