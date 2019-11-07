import { Pos } from "src/Pos";
import { ClientGame } from "./ClientGame";
import { HumanPlayer } from "src/base/HumanPlayer";

/**
 * 
 * 
 * @extends HumanPlayer
 */
export class OnlineHumanPlayer extends HumanPlayer {

    public constructor(game: ClientGame, idNumber: number) {
        super(game, idNumber);
    }

    /**
     * @override {@link Player#makeMovementRequest}
     */
    public makeMovementRequest(dest: Pos): void {
        // TODO send request to server.
    }

}
