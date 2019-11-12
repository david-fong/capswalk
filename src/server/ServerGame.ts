import * as io      from "socket.io";

import { Pos } from "src/base/Tile";
import { Game, PlayerMovementEvent, GameStateDump } from "src/base/Game";
import { ServerTile } from "src/server/ServerTile";
import { EventNames, SocketIoNamespaces } from "src/EventNames";

/**
 * 
 * 
 * @extends Game
 */
export class ServerGame extends Game {

    public constructor(height: number, width: number = height) {
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



    /**
     * Called automatically by {@link ServerGame#processMoveRequest}.
     * 
     * @override {@link Game#processMoveExecute}
     */
    protected processMoveExecute(desc: PlayerMovementEvent): void {
        super.processMoveExecute(desc);

        // Emit an event-notification to all clients.
        this.namespace.emit(EventNames.PLAYER_MOVEMENT, {
            // TODO
        });
    }



    protected allocatePlayerId(): number {
        return -1; // TODO
    }

}
