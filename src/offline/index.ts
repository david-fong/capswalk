import { WebHooks }        from "../webui/WebHooks";
import { Coord }            from "floor/Tile";
import { BalancingScheme }  from "lang/LangSeqTreeNode";
import { OfflineGame }      from "./OfflineGame";
import { PostInit }         from "game/PostInit";

PostInit();

// TODO.design override ctor args for each impl, and make it so they adapt input to pass to super ctor.
const game = new OfflineGame<Coord.System.EUCLID2>({
    coordSys: Coord.System.EUCLID2,
    gridDimensions: {
        height: 20,
        width:  20,
    },
    gridHtmlIdHook: WebHooks.Grid.Id.GRID,
    averageFreeHealthPerTile: 1.0 / 70.0,
    langBalancingScheme: BalancingScheme.WEIGHT,
    languageName: "ENGLISH__LOWERCASE",
    operatorIndex: 0,
    playerDescs: [
        {
            familyId: "HUMAN",
            teamId: 0,
            username: "hello world",
            socketId: "todo", // TODO.impl maybe make some static method to assign unique values based on operator class?
        },
    ],
});
game.reset();
console.log(game);
