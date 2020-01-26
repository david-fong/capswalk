import { Coord } from "floor/Coord";
import { BalancingScheme } from "lang/LangSeqTreeNode";
import { OfflineGame } from "./OfflineGame";
import { Player } from "game/player/Player";

// TODO: override ctor args for each impl, and make it so they adapt input to pass to super ctor.
const game = new OfflineGame<Coord.System.EUCLID2>({
    coordSys: Coord.System.EUCLID2,
    gridDimensions: {
        height: 20,
        width:  20,
    },
    langBalancingScheme: BalancingScheme.WEIGHT,
    languageName: "English",
    operatorIndex: 0,
    playerDescs: {
        [Player.Family.HUMAN]: [{
            beNiceTo: [],
            username: "hello world",
            socketId: "todo", // TODO hmm. maybe make some static method to assign unique values based on operator class?
        }, ],
        [Player.Family.CHASER]: [],
    },
});
game.reset();
console.log(game);
