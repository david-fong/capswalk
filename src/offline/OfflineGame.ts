import { VisibleTile } from "src/offline/VisibleTile";
import { Game } from "src/base/Game";

/**
 * 
 * 
 * @extends Game
 */
export class OfflineGame extends Game {

    public constructor(height: number, width: number = height) {
        super(height, width);
    }

    /**
     * @override {@link Grid#createTile}
     */
    public createTile(x: number, y: number): VisibleTile {
        return new VisibleTile(x, y);
    }

}
