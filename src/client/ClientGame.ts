import { Pos } from "src/Pos";
import { Tile } from "src/base/Tile";
import { VisibleTile } from "src/offline/VisibleTile";
import { Grid } from "src/base/Grid";
import { Game } from "src/base/Game";

/**
 * 
 * 
 * @extends Game
 */
export class ClientGame extends Game {

    public constructor(height: number, width: number = height) {
        super(height, width);

        // TODO: bind processMoveExecute to event notification.
    }

    /**
     * @override `Game::reset`
     */
    public reset(): void {
        // Bypass my direct parent's reset implementation.
        Grid.prototype.reset.call(this);
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
    public processMoveRequest(playerId: number, dest: Tile | Pos): never {
        throw new TypeError("This operation unsupported for the ClientGame class.")
    }

}
