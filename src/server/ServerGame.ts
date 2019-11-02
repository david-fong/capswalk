
/**
 * 
 * 
 * @extends Game
 */
class ServerGame extends Game {

    public constructor(height: number, width: number = height) {
        super(height, width);

        // TODO bind ::processMoveRequest to event notification from clients.
    }

    /**
     * @implements `Grid::createTile`
     */
    public createTile(x: number, y: number): ServerTile {
        return new ServerTile(x, y);
    }

    /**
     * @implements `Game::processMoveExecute`
     */
    protected processMoveExecute(desc: PlayerMovementEvent): void {
        super.processMoveExecute(desc);
        // TODO: emit an event to all clients.
    }

}
