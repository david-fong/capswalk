require("../../assets/style/game/index.css");

import { OmHooks }          from "defs/OmHooks";
import type { Coord }       from "floor/Tile";
import { Lang }             from "defs/TypeDefs";
import { IndexTasks }       from "game/IndexTasks";

IndexTasks.INIT_CLASS_REGISTRIES();

// TODO.build this has been set to `var` for testing purposes. It should be `const` in production.
export const game = new (import("./OfflineGame").OfflineGame({
    gridElem: ,
}, {
    coordSys: "EUCLID2" as Coord.System.EUCLID2,
    gridDimensions: {
        height: 21,
        width:  21,
    },
    averageFreeHealthPerTile: 1.0 / 45.0,
    langBalancingScheme: Lang.BalancingScheme.WEIGHT,
    languageName: "engl-low",
    playerDescs: [
        {
            isALocalOperator: true,
            familyId:   <const>"HUMAN",
            teamId:     0,
            socketId:   undefined,
            username:   "hello world",
            noCheckGameOver: false,
            familyArgs: { },
        }, {
            isALocalOperator: false,
            familyId:   <const>"CHASER",
            teamId:     1,
            socketId:   undefined,
            username:   "chaser test",
            noCheckGameOver: true,
            familyArgs: {
                fearDistance: 5,
                bloodThirstDistance: 7,
                healthReserve: 3.0,
                movesPerSecond: 2.0,
            }
        }
    ],
}));

// Print some things:
// console.log(game);
// console.log(game.lang.simpleView());

game.statusBecomePlaying();
