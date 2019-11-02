
/**
 * 
 * 
 * @extends Game
 */
class ClientGame extends Game {

    public constructor(height: number, width: number = height) {
        super(height, width);
    }

    /**
     * @implements `Grid::createTile`
     */
    public createTile(x: number, y: number): VisibleTile {
        return new VisibleTile(x, y);
    }

    /**
     * @implements `super.processPlayerMovement`
     */
    protected processPlayerMovement(desc: PlayerMovementEvent): void {
        // TODO
    }

}
