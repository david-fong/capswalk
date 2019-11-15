import { Events } from "src/Events";
import { ServerTile } from "src/server/ServerTile";
import { Game } from "src/base/Game";
import { PlayerMovementEvent } from "src/base/Player";
import { GroupSession } from "src/server/GroupSession";

/**
 * 
 * 
 * @extends Game
 */
export class ServerGame extends Game {

    protected readonly session: GroupSession;

    public constructor(
        session: GroupSession,
        height: number,
        width:  number = height,
    ) {
        super(height, width);
        this.session = session;

        this.reset();
    }

    /**
     * @override
     */
    public reset(): void {
        super.reset();
        // TODO: broadcast a gamestate dump to all clients
        // and wait for each of their acks before starting to
        // actually process their movement requests and making
        // any artificial players start moving.
    }

    /**
     * @override
     */
    public createTile(x: number, y: number): ServerTile {
        return new ServerTile(x, y);
    }

    /**
     * @override
     */
    public processMoveRequest(desc: PlayerMovementEvent): PlayerMovementEvent | null {
        desc = super.processMoveRequest(desc);
        if (desc !== null) {
            // Request was accepted.
            // Pass on change descriptor to all clients:
            this.session.namespace.emit(
                Events.PlayerMovement.name,
                desc,
            );
        }
        return desc;
    }

}
