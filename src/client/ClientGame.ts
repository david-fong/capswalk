
/**
 * 
 * 
 * @extends Game
 */
class ClientGame extends Game {

    public constructor(height: number, width: number = height) {
        super(height, width);

        // TODO: bind processMoveExecute to event notification.
    }

    /**
     * @implements `Grid::createTile`
     */
    public createTile(x: number, y: number): VisibleTile {
        return new VisibleTile(x, y);
    }

    /**
     * @override `Game::processMoveExecute`
     * @throws `TypeError` Unconditionally.
     */
    public processMoveRequest(playerId: number, dest: Tile | Pos): void {
        throw new TypeError("This operation unsupported for the ClientGame class.")
    }

}
