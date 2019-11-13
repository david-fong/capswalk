import { Game } from "src/base/Game";
import { ServerTile } from "src/server/ServerTile";
import { GroupSession } from "src/server/GroupSession";

/**
 * 
 * 
 * @extends Game
 */
export class ServerGame extends Game {

    protected readonly session: GroupSession;

    public constructor(session: GroupSession, height: number, width: number = height) {
        super(height, width);

        this.reset();
    }

    public reset(): void {
        super.reset();
    }

    /**
     * @override {@link Grid#createTile}
     */
    public createTile(x: number, y: number): ServerTile {
        return new ServerTile(x, y);
    }



    protected allocatePlayerId(): number {
        return -1; // TODO
    }

}
