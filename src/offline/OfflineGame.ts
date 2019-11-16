import { BarePos } from "src/Pos";
import { VisibleTile } from "src/offline/VisibleTile";
import { Game } from "src/base/Game";
import { LocalGameSettings } from "src/settings/GameSettings";

/**
 * 
 * 
 * @extends Game
 */
export class OfflineGame extends Game {

    protected settings: LocalGameSettings;

    public constructor(dimensions: { height: number, width?: number, }) {
        super(dimensions);
        this.settings = LocalGameSettings.getInstance();
    }

    /**
     * @override {@link Grid#createTile}
     */
    public createTile(pos: BarePos): VisibleTile {
        return new VisibleTile(pos);
    }

}
