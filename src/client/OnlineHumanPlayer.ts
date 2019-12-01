import { Tile } from "src/base/Tile";
import { ClientGame } from "src/client/ClientGame";
import { HumanPlayer } from "src/base/player/HumanPlayer";
import { PlayerId } from "src/base/player/Player";
import { PlayerMovementEvent } from "src/events/PlayerMovementEvent";



/**
 * The choice of this is somewhat arbitrary. This should be enforced
 * externally since player descriptors are passed to the constructor.
 */
export const USERNAME_REGEXP = new RegExp("[a-zA-Z](\s?[a-zA-Z0-9:-]+)*");

/**
 * 
 * @extends HumanPlayer
 */
export class OnlineHumanPlayer extends HumanPlayer {

    public readonly username: string;

    /**
     * @override
     */
    public readonly game: ClientGame;



    public constructor(
        game: ClientGame,
        idNumber: PlayerId,
        username: string,
    ) {
        super(game, idNumber);
        this.username = username;
        if (!(USERNAME_REGEXP.test(username))) {
            throw new RangeError(
                `Username \"${username}\" does not match the required regexp.`
            );
        }
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
