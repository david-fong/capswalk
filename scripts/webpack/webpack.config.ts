import path = require("path");

import {
	PROJECT_ROOT,
	__BaseConfig,
	__applyCommonNodeConfigSettings,
} from "./webpack.base.config";

import { CLIENT_CONFIG } from "./webpack.client.config";

/** */
const SERVER_CONFIG = __BaseConfig("server"); {
	const config = SERVER_CONFIG;
	__applyCommonNodeConfigSettings(config);
	config.entry["index"] = `./src/server/index.ts`;
}

/** */
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