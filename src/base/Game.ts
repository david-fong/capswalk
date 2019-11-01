
/**
 * 
 * 
 * This class performs the majority of management over `Tile` and
 * `Player` objects.
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
    }

    public shuffleLangSeq(tile: Tile): void {
        // TODO
    }

}
