
/**
 * 
 * 
 * @extends Game
 */
class ServerGame extends Game {

    public constructor(height: number, width: number = height) {
        super(height, width);
    }

    /**
     * @implements `Grid::createTile`
     */
    public createTile(x: number, y: number): ServerTile {
        return new ServerTile(x, y);
    }

    /**
     * @implements `super.processPlayerMovement`
     */
    protected processPlayerMovement(desc: PlayerMovementEvent): void {
        // TODO
    }

}
