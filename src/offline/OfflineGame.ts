
/**
 * 
 * 
 * @extends Game
 */
class OfflineGame extends Game {

    public constructor(height: number, width: number = height) {
        super(height, width);
    }

    /**
     * @implements `Grid::createTile`
     */
    public createTile(x: number, y: number): VisibleTile {
        return new VisibleTile(x, y);
    }

}
