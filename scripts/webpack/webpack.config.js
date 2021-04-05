"use strict";
const BASE = require("./webpack.base.config");
const CLIENT = require("./webpack.client.config");

/** */
const SERVER_CONFIG = BASE.__BaseConfig("server");
{
	const config = SERVER_CONFIG;
	BASE.__applyCommonNodeConfigSettings(config);
	config.entry["index"] = { import: `./src/server/index.ts` };

	if (BASE.MODE.dev) {
		// Include test code for dev builds;
		config.resolve.modules.push(BASE.PROJECT_ROOT("src"));
		BASE.__applyCommonNodeConfigSettings(config);
		["lang",].forEach((name) => {
			config.entry["test/"+name] = {
				import: `./src/test/${name}/index.ts`,
			};
		});
	}
}

module.exports = Object.freeze({
	client: CLIENT.CLIENT_CONFIG,
	server: SERVER_CONFIG,
});