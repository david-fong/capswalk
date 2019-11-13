import * as io from "socket.io";

import { Events } from "src/Events";
import { Pos, BarePos } from "src/base/Tile";
import { ClientGame } from "src/client/ClientGame";
import { HumanPlayer } from "src/base/HumanPlayer";

/**
 * 
 * 
 * @extends HumanPlayer
 */
export class OnlineHumanPlayer extends HumanPlayer {

    /**
     * @override {@link Player#game}
     */
    public readonly game: ClientGame;



    public constructor(game: ClientGame, idNumber: number) {
        super(game, idNumber);
    }



    /**
     * @override {@link Player#makeMovementRequest}
     */
    public makeMovementRequest(dest: Pos): void {
        this.emitPlayerMoveRequest(
            this.idNumber,
            dest.asBarePos(),
            this.game.processMoveExecute,
        );
    }
    private emitPlayerMoveRequest(
        playerId: number,
        destPos: BarePos,
        ack: Events.PlayerMovement.Acknowlege
    ): void {
        this.game.socket.emit(
            Events.PlayerMovement.name,
            playerId,
            destPos,
            ack,
        );
    }

    /**
     * {@link Events}
     */
    private verifyCallbackFuncSignatures(): never {
        this.emitPlayerMoveRequest as Events.PlayerMovement.Initiate;
        throw new Error("We don't do that here.");
    }

}
