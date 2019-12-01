import { setTimeout } from "timers";

import { BarePos } from "src/Pos";
import { ServerTile } from "src/server/ServerTile";
import { GridDimensionDesc, Game } from "src/base/Game";
import { GroupSession } from "src/server/GroupSession";

import { PlayerId } from "src/base/player/Player";
import { PuppetPlayer } from "src/base/player/PuppetPlayer";
import { HumanPlayer } from "src/base/player/HumanPlayer";

import { EventRecordEntry } from "src/events/EventRecordEntry";
import { PlayerMovementEvent } from "src/events/PlayerMovementEvent";
import { Bubble } from "src/events/Bubble";

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

    /**
     * @override
     */
    protected createOperatorPlayer(idNUmber: PlayerId): HumanPlayer {
        return undefined;
    }

    /**
     * @override
     */
    protected createArtifPlayer(idNumber: PlayerId): PuppetPlayer {
        return new PuppetPlayer(this, idNumber);
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
    public processMoveExecute(desc: Readonly<PlayerMovementEvent>): void {
        super.processMoveExecute(desc);

        if (desc.eventId === EventRecordEntry.REJECT) {
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

    public processBubbleMakeExecute(desc: Readonly<Bubble.MakeEvent>): void {
        super.processBubbleMakeExecute(desc);

        if (desc.eventId === EventRecordEntry.REJECT) {
            // The request was rejected- Notify the requester.
            // TODO: don't broadcast. just respond directly to the requester.
            this.session.namespace.emit(
                Bubble.MakeEvent.EVENT_NAME,
                desc,
            );
        } else {
            // Request was accepted.
            // Pass on change descriptor to all clients:
            this.session.namespace.emit(
                Bubble.MakeEvent.EVENT_NAME,
                desc,
            );
        }
    }

    /**
     * @override
     */
    protected processBubblePopExecute(desc: Readonly<Bubble.PopEvent>): void {
        ;
        super.processBubblePopExecute(desc);

        if (desc.eventId === EventRecordEntry.REJECT) {
            throw new Error("This should never happen.");
        } else {
            // Request was accepted.
            // Pass on change descriptor to all clients:
            this.session.namespace.emit(
                Bubble.PopEvent.EVENT_NAME,
                desc,
            );
        }
    }

}
