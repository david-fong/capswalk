
/**
 * 
 * 
 * This class performs the majority of management over `Tile` and
 * `Player` objects.
 * 
 * @extends Grid
 */
abstract class Game extends Grid {

    processMoveRequest(player: Player): void {
        if (player instanceof HumanPlayer) {

        }
    }

    /**
     * @override
     */
    public reset(): void {
        super.reset();
        // TODO: reset players and other things.
    }

    public shuffleLangSeq(tile: Tile): void {
        // TODO
    }

}
