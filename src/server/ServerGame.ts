import { Events } from "src/Events";
import { BarePos } from "src/Pos";
import { ServerTile } from "src/server/ServerTile";
import { Game } from "src/base/Game";
import { GroupSession } from "src/server/GroupSession";
import { PlayerMovementEvent } from "src/base/PlayerMovementEvent";

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
        const reponseDesc = super.processMoveRequest(desc);
        if (reponseDesc !== null) {
            // Request was accepted.
            // Pass on change descriptor to all clients:
            this.session.namespace.emit(
                Events.PlayerMovement.name,
                reponseDesc,
            );
        } else {
            // The request was rejected.
            // Notify the requester. Note the use of `desc` instead of
            // `responseDesc`. `desc` can be used with no change. Its
            // request ID field is correctly unchanged, which according
            // to the spec, indicates a rejected request.
            // TODO: don't broadcast. just respond directly to the requester.
            this.session.namespace.emit(
                Events.PlayerMovement.name,
                desc,
            );
        }
        return desc;
    }

}
