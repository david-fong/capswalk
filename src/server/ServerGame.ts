import { setTimeout } from "timers";

import { BarePos } from "src/Pos";
import { ServerTile } from "src/server/ServerTile";
import { GridDimensionDesc, Game } from "src/base/Game";
import { GroupSession } from "src/server/GroupSession";
import { PlayerMovementEvent } from "src/events/PlayerMovementEvent";

/**
 * 
 * 
 * @extends Game
 */
export class ServerGame extends Game {

    protected readonly session: GroupSession;

    /**
     * _Calls reset recursively for this entire composition._
     * 
     * @param session - 
     * @param dimensions - 
     */
    public constructor(
        session: GroupSession,
        dimensions: GridDimensionDesc,
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

    public setTimeout(callback: VoidFunction, millis: number, ...args: any[]): NodeJS.Timeout {
        return setTimeout(callback, millis, args).unref();
    }

    public cancelTimeout(handle: NodeJS.Timeout): void {
        clearTimeout(handle);
    }

    /**
     * @override
     */
    public processMoveExecute(desc: PlayerMovementEvent): void {
        super.processMoveExecute(desc);

        const requestRejected: boolean = (
            desc.lastAcceptedRequestId ===
            this.getPlayerById(desc.playerId).lastAcceptedRequestId
        );
        if (requestRejected) {
            // The request was rejected- Notify the requester.
            // TODO: don't broadcast. just respond directly to the requester.
            this.session.namespace.emit(
                PlayerMovementEvent.EVENT_NAME,
                desc,
            );
        } else {
            // Request was accepted.
            // Pass on change descriptor to all clients:
            this.session.namespace.emit(
                PlayerMovementEvent.EVENT_NAME,
                desc,
            );
        }
    }

}
