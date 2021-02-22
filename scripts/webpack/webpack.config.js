"use strict";
const BASE = require("./webpack.base.config");
const CLIENT = require("./webpack.client.config");

/** */
const SERVER_CONFIG = BASE.__BaseConfig("server");
{
	const config = SERVER_CONFIG;
	BASE.__applyCommonNodeConfigSettings(config);
	config.entry["index"] = `./src/server/index.ts`;
}
/** */
const TEST_CONFIG = BASE.__BaseConfig("test");
{
	const config = TEST_CONFIG;
	config.resolve.modules.push(BASE.PROJECT_ROOT("src"));
	BASE.__applyCommonNodeConfigSettings(config);
	["lang",].forEach((name) => {
		config.entry[name] = `./test/${name}/index.ts`;
	});
}
module.exports = Object.freeze({
	client: CLIENT.CLIENT_CONFIG,
	server: SERVER_CONFIG,
});