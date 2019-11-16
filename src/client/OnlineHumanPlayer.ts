import { Events } from "src/Events";
import { Tile } from "src/base/Tile";
import { ClientGame } from "src/client/ClientGame";
import { HumanPlayer } from "src/base/HumanPlayer";
import { PlayerMovementEvent } from "src/base/Player";



/**
 * The choice of this is somewhat arbitrary. This should be enforced
 * externally since player descriptors are passed to the constructor.
 */
export const USERNAME_REGEXP = new RegExp("[a-zA-Z](\s?[a-zA-Z0-9:-]+)*");

/**
 * TODO: should the player class still process operator input in the
 * time after sending a movement request? If we make it ignore while
 * waiting, we need to make the server ack saying whether the request
 * was accepted or not.
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
        username: string,
        game: ClientGame,
        idNumber: number,
    ) {
        super(game, idNumber);
        this.username = username;
        if (!(USERNAME_REGEXP.test(username))) {
            throw new RangeError(
                `username \"${username}\" does not match the required regexp.`
            );
        }
    }



    /**
     * @override
     */
    public makeMovementRequest(dest: Tile): void {
        // ServerGame handles with processMoveRequest.
        // Arguments must follow that function signature.
        this.game.socket.emit(
            Events.PlayerMovement.name,
            new PlayerMovementEvent(this.idNumber, dest),
        );
    }

}
