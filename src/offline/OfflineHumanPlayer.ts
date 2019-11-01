
/**
 * 
 */
class OfflineHumanPlayer extends HumanPlayer {

    public constructor(game: Game, idNumber: number) {
        super(game, idNumber);
    }



    /**
     * Unlike the online situation, the Game Manager is run in the same
     * JavaScript engine as the Operator's player. We can make a direct
     * request to the Game Manager to process the movement request.
     */
    public makeMovementRequest(): void {
        this.game.processMoveRequest(this);
    }
}