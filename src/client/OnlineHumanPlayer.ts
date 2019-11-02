
/**
 * 
 * 
 * @extends HumanPlayer
 */
class OnlineHumanPlayer extends HumanPlayer {

    public constructor(game: ClientGame, idNumber: number) {
        super(game, idNumber);
    }

    /**
     * @implements `Player::makeMovementRequest`
     */
    public makeMovementRequest(dest: Pos): void {
        // TODO send request to server.
    }

}
