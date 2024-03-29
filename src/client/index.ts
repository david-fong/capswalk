import "my-type-utils/ModBrowserPlatform";

import "./style/common.css";
import "./style/barrel.css";
import { TopLevel } from "./TopLevel";

// window.onerror = (msg, url, lineNum) => {
//     alert(`Error message: ${msg}\nURL: ${url}\nLine Number: ${lineNum}`);
//     return true;
// }

const _top = new TopLevel();
export const top = (() => {
	return (DEF.NodeEnv === "development") ? _top : undefined;
})();

export function screen(): TopLevel["currentScreen"] {
	return _top.currentScreen;
}
export function game(): TopLevel["game"] {
	return _top.game;
}

console.info("%c🩺 welcome! 🐍", "font:700 2.3em /1.5 monospace;"
+" margin:0.4em; border:0.3em solid black;padding:0.4em;"
+" color:white; background-color:#3f5e77; border-radius:0.7em;");

/**
 * https://developers.google.com/web/fundamentals/primers/service-workers
 */
/* ((): void => {
if (_top.siteServerType === TopLevel.SiteServerType.GITHUB && "serviceWorker" in navigator) {
	window.addEventListener('load', function() {
		// https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register
		navigator.serviceWorker.register("/ServiceWorker.js").then(
		(registration) => {
			console.info('ServiceWorker registration successful with scope: ', registration.scope);
		},
		(err) => {
			console.info('ServiceWorker registration failed: ', err);
		});
		// TODO.learn Using Service Workers to make an offline-friendly PWA.
		// https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Offline_Service_workers
	});
}
})(); */