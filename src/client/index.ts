import { OmHooks }          from "browser/OmHooks";
import { Coord }            from "floor/Tile";
import { BalancingScheme }  from "lang/LangSeqTreeNode";
import { OfflineGame }      from "./OfflineGame";
import { IndexTasks }       from "game/IndexTasks";
require("../../assets/style/index.css");

IndexTasks.INIT_CLASS_REGISTRIES();

(() => {
    if (window.origin && window.origin !== "null" && "serviceWorker" in navigator) {
        // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register
        navigator.serviceWorker.register("./src/client/ServiceWorker.js");
        // TODO.learn Using Service Workers to make an offline-friendly PWA.
        // https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Offline_Service_workers
    }
})();

// TODO.design override ctor args for each impl, and make it so they adapt input to pass to super ctor.
// TODO.build this has been set to `var` for testing purposes. It should be `const` in production.
export const game = new OfflineGame<Coord.System.EUCLID2>({
    coordSys: Coord.System.EUCLID2,
    gridDimensions: {
        height: 21,
        width:  21,
    },
    gridHtmlIdHook: OmHooks.Grid.Id.GRID,
    averageFreeHealthPerTile: 1.0 / 70.0,
    langBalancingScheme: BalancingScheme.WEIGHT,
    languageName: "engl-low",
    operatorIndex: 0,
    playerDescs: [
        {
            familyId:   "HUMAN",
            teamId:     0,
            socketId:   undefined,
            username:   "hello world",
            noCheckGameOver: false,
        },
    ],
});

// Print some things:
console.log(game);
console.log(game.lang.simpleView());

game.statusBecomePlaying();

// window.onerror = (msg, url, lineNum) => {
//     alert(`Error message: ${msg}\nURL: ${url}\nLine Number: ${lineNum}`);
//     return true;
// }
