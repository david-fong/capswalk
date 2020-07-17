// Tell WebPack we want CSS:
require("assets/style/initial/_barrel.css");

import { TopLevel } from "./TopLevel";

export { OmHooks } from "defs/OmHooks";



// window.onerror = (msg, url, lineNum) => {
//     alert(`Error message: ${msg}\nURL: ${url}\nLine Number: ${lineNum}`);
//     return true;
// }

export const top = new TopLevel();

/**
 * https://developers.google.com/web/fundamentals/primers/service-workers
 */
((): void => {
if (top.webpageHostType === TopLevel.WebpageHostType.GITHUB && "serviceWorker" in navigator) {
    window.addEventListener('load', function() {
        // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register
        navigator.serviceWorker.register("/ServiceWorker.js").then(
        (registration) => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        },
        (err) => {
            console.log('ServiceWorker registration failed: ', err);
        });
        // TODO.learn Using Service Workers to make an offline-friendly PWA.
        // https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Offline_Service_workers
    });
}
})();
