import { Coord } from "floor/Coord";
import { BalancingScheme } from "lang/LangSeqTreeNode";
import { OfflineGame } from "./OfflineGame";
import { Player } from "game/player/Player";

// TODO: override ctor args for each impl, and make it so they adapt input to pass to super ctor.
const game = new OfflineGame({
    coordSys: Coord.System.EUCLID2,
    gridDimensions: {
        height: 20,
    },
    langBalancingScheme: BalancingScheme.WEIGHT,
    languageName: "English",
    playerDescs: [
        {
            beNiceTo: [],
            operatorClass: Player.Operator.HUMAN,
            username: "hello world",
            idNumber: undefined,
            socketId: "todo", // TODO hmm. maybe make some static method to assign unique values based on operator class?
        },
    ],
});
game.reset();
console.log(game);
