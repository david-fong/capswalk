// Tell WebPack we want CSS:
require("assets/style/initial/index.css");

import { TopLevel } from '../client/TopLevel';

((): void => {
    if (window.origin && window.origin !== "null" && "serviceWorker" in navigator) {
        // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register
        navigator.serviceWorker.register("./src/client/ServiceWorker.js");
        // TODO.learn Using Service Workers to make an offline-friendly PWA.
        // https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Offline_Service_workers
    }
})();

// window.onerror = (msg, url, lineNum) => {
//     alert(`Error message: ${msg}\nURL: ${url}\nLine Number: ${lineNum}`);
//     return true;
// }

export const top = new TopLevel();
