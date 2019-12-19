import { OfflineGame } from "./OfflineGame";
import { BalancingScheme } from "lang/LangSeqTreeNode";
import { Player } from "game/player/Player";

const game = new OfflineGame({
    gridDimensions: {
        height: 20,
    },
    langBalancingScheme: BalancingScheme.WEIGHT,
    languageName: "English",
    playerDescs: [
        {
            beNiceTo: [],
            operatorClass: Player.OperatorClass.HUMAN,
            username: "hello world",
            idNumber: undefined,
            socketId: undefined,
        },
    ],
});
game.reset();
console.log(game);
