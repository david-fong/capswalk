import { Tile } from "src/base/Tile";
import { ClientGame } from "src/client/ClientGame";
import { Player } from "src/base/player/Player";
import { HumanPlayer } from "src/base/player/HumanPlayer";
import { PlayerMovementEvent } from "src/events/PlayerMovementEvent";


/**
 * 
 * @extends HumanPlayer
 */
export class OnlineHumanPlayer extends HumanPlayer {

    /**
     * @override
     */
    public readonly game: ClientGame;

    /**
     * @override
     */
    public readonly beNiceTo: Player["beNiceTo"];



    public constructor(
        game: ClientGame,
        desc: Player.CtorArgs,
    ) {
        super(game, desc);
        this.beNiceTo = (desc.beNiceTo as Array<Player.Id>).sort((a, b) => a - b);
        // TODO: remove type-cast after making implementation specific `ConstructorArguments`.
    }



    /**
     * @override
     */
    public abstractMakeMovementRequest(dest: Tile): void {
        // ServerGame handles with processMoveRequest.
        // Arguments must follow that function signature.
        this.game.socket.emit(
            PlayerMovementEvent.EVENT_NAME,
            new PlayerMovementEvent(
                this.idNumber,
                this.lastAcceptedRequestId,
                dest,
            ),
        );
    }

}
