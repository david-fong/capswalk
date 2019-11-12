import { Game, PlayerMovementEvent, GameStateDump } from "src/base/Game";
import { ServerTile } from "src/server/ServerTile";
import { EventNames } from "src/EventNames";
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



    /**
     * Called automatically by {@link ServerGame#processMoveRequest}.
     * 
     * @override {@link Game#processMoveExecute}
     */
    protected processMoveExecute(desc: PlayerMovementEvent): void {
        super.processMoveExecute(desc);

        // TODO: set fields of desc describing the charseqpair that got
        // shuffled-in, and whether a 

        // Emit an event-notification to all clients.
        this.session.namespace.emit(EventNames.PLAYER_MOVEMENT, desc);
    }



    protected allocatePlayerId(): number {
        return -1; // TODO
    }

}
