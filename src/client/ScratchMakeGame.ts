require("../../assets/style/game/index.css");

import { OmHooks }          from "browser/OmHooks";
import type { Coord }       from "floor/Tile";
import { Lang }             from "utils/TypeDefs";
import { OfflineGame }      from "./OfflineGame";
import { IndexTasks }       from "game/IndexTasks";

IndexTasks.INIT_CLASS_REGISTRIES();

// TODO.design override ctor args for each impl, and make it so they adapt input to pass to super ctor.
// TODO.build this has been set to `var` for testing purposes. It should be `const` in production.
export const game = new OfflineGame<Coord.System.EUCLID2>({
    coordSys: "EUCLID2" as Coord.System.EUCLID2,
    gridDimensions: {
        height: 21,
        width:  21,
    },
    gridHtmlIdHook: OmHooks.Grid.Id.GRID,
    averageFreeHealthPerTile: 1.0 / 70.0,
    langBalancingScheme: Lang.BalancingScheme.WEIGHT,
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
// console.log(game);
// console.log(game.lang.simpleView());

game.statusBecomePlaying();
