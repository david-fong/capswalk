import { Events } from "src/Events";
import { BarePos } from "src/Pos";
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
        dimensions: { height: number, width?: number, },
    ) {
        super(dimensions);
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
    public createTile(pos: BarePos): ServerTile {
        return new ServerTile(pos);
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
