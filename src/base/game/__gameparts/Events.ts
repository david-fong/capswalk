import type { Coord } from "floor/Tile";
import { Game } from "../Game";

import { PlayerActionEvent, TileModificationEvent } from "../events/PlayerActionEvent";
import { EventRecordEntry } from "../events/EventRecordEntry";

import { GameBase } from "./Base";


/**
 * All events have two corresponding handler functions taking a
 * request descriptor object ("desc"):
 *
 * ### Request Processor
 *
 * The request processor is only used by the Game Manager. It decides
 * whether to accept or reject the request based on `desc` and may
 * throw exceptions on impossible arguments. It should not make any
 * changes to the game state. Instead, it is responsible to augment
 * `desc` with information describing what changes to the game state
 * must be made.
 *
 * ### Request Executor
 *
 * This takes the `desc` augmented by the request processor and enacts
 * all the described changes upon the game's state. If the Game Manager
 * is not local to the client (a server process), then this handler is
 * called at both the server and client.
 *
 * Updates the event record if the response is accepted.
 */
export abstract class GameEvents<G extends Game.Type, S extends Coord.System> extends GameBase<G,S> {

    /**
     * All copies of the game should contain identical entries. That
     * in a {@link ClientGame} may at any instant be missing trailing
     * entries, or contain some trailing holes, but such gaps should
     * eventually be filled to match those in the Game Manager.
     *
     * Do not modify this directly. To register an accepted event,
     * call the {@link Game#recordEvent} method, passing it the event
     * descriptor. To create a new event ID at the Game Manager, just
     * take the current length of this array.
     */
    private readonly eventRecord: Array<Readonly<EventRecordEntry>>;

    public constructor(
        gameType: G,
        impl: Game.ImplArgs<S>,
        gameDesc: Game.CtorArgs<G,S>,
    ) {
        super(gameType, impl, gameDesc);
        this.eventRecord = [];
    }

    public reset(): void {
        // Clear the event record:
        this.eventRecord.splice(0);

        super.reset();
    }

    protected getNextUnusedEventId(): EventRecordEntry["eventId"] {
        return this.eventRecord.length;
    }


    /**
     * Basically does `this.eventRecord[id] = desc;` with value checking.
     *
     * @param desc -
     *
     * @throws
     * In the given order of priority:
     * - TypeError if the event ID indicates a rejected request
     * - RangeError if it is not a positive integer
     * - Error if another event was already recorded with the same ID.
     */
    private recordEvent(desc: Readonly<EventRecordEntry>): void {
        const id = desc.eventId;
        if (id === EventRecordEntry.EVENT_ID_REJECT) {
            throw new TypeError("Do not try to record events for rejected requests.");
        } else if (id < 0 || id !== Math.trunc(id)) {
            throw new RangeError("Event ID's must only be assigned positive, integer values.");
        } else if (this.eventRecord[id]) {
            throw new Error("Event ID's must be assigned unique values.");
        }
        // NOTE: If storage becomes a concern with logging events,
        // create a static constant for the record's buffer size,
        // and then here, wrap around.
        this.eventRecord[id] = desc;
    }


    private executeTileModificationsEvent(
        desc: TileModificationEvent<S>,
        doCheckOperatorSeqBuffer: boolean = true,
    ): void {
        const dest = this.grid.tile.at(desc.coord);
        if (dest.lastKnownUpdateId < desc.lastKnownUpdateId) {
            if (desc.newCharSeqPair) {
                dest.setLangCharSeq(desc.newCharSeqPair);
                // Refresh the operator's `seqBuffer` (maintain invariant) for new CSP:
                if (doCheckOperatorSeqBuffer && this.operator !== undefined
                    && !(this.operator.tile.destsFrom().get.includes(dest))) {
                    // ^Do this when non-operator moves into the the operator's vicinity.
                    this.operator.seqBufferAcceptKey("");
                }
            }
            dest.lastKnownUpdateId = desc.lastKnownUpdateId;
            dest.freeHealth = desc.newFreeHealth!;
        }
    }

    /**
     * Update the {@link Game#grid}. Call either at the end of
     * {@link Game#processMoveRequest} if I am a {@link ServerGame} or
     * {@link OfflineGame}, or as an event callback if I am a
     * {@link ClientGame}.
     *
     * Automatically lowers the {@link Player#requestInFlight} field
     * for the requesting `Player` if the arriving event description
     * is the newest one for the specified `Player`.
     *
     * Updates that are received after others that are more recent and
     * concern the same {@link Tile} are ignored. This is okay since
     * the only thing that matters about a {@link Tile} to the outside
     * world is its last known state.
     *
     * @param desc
     * A descriptor for all changes mandated by the player-movement event.
     */
    protected processMoveExecute(desc: Readonly<PlayerActionEvent.Movement<S>>): void {
        const player = this.players[desc.playerId];
        const dest   = this.grid.tile.at(desc.dest.coord);
        const clientEventLag = desc.playerLastAcceptedRequestId - player.lastAcceptedRequestId;

        if (desc.eventId !== EventRecordEntry.EVENT_ID_REJECT) {
            // Rejected request. Implies either that: clientEventLag === 0,
            // or that (at Game Manager): dest.numTimesOccupied > desc.destNumTimesOccupied
            if (clientEventLag === 1) {
                player.requestInFlight = false;
            }
            return; // Short-circuit!
        }
        this.recordEvent(desc);
        this.executeTileModificationsEvent(desc.dest, player !== this.operator);
        desc.tilesWithHealthUpdates!.forEach((desc) => {
            this.executeTileModificationsEvent(desc)
        });

        if (clientEventLag > 1) {
            // ===== Out of order receipt (client-side) =====
            // Already received more recent request responses.
            if (player === this.operator) {
                // Operator never receives their own updates out of
                // order because they only have one unacknowledged
                // in-flight request at a time.
                throw new Error("This never happens. See comment in source.");
            }
            return; // Short-circuit!
        }
        // Okay- the response is an acceptance of the specified player's most
        // recent request pending this acknowledgement.
        player.requestInFlight = false;
        if ((player === this.operator)
            ? (clientEventLag === 1)
            : (clientEventLag <= 1)) {
            player.status.score     = desc.newPlayerHealth!.score;
            player.status.health = desc.newPlayerHealth!.health;

            player.moveTo(dest);
            // Below is computationally the same as "(player.lastAcceptedRequestId)++"
            player.lastAcceptedRequestId = desc.playerLastAcceptedRequestId;

        } else {
            // Apparent negative lag. The operator may somehow have
            // tampered with their player's request counter.
            throw new Error("This never happens. See comment in source");
        }
    }


    /**
     *
     * Automatically lowers the {@link Player#requestInFlight} field
     * for the requesting `Player`.
     *
     * @param desc -
     */
    protected processBubbleExecute(desc: Readonly<PlayerActionEvent.Bubble>): void {
        // TODO.impl Visually highlight the affected tiles for the specified estimate-duration.
        const bubbler = this.players[desc.playerId];

        bubbler.requestInFlight = false;

        if (desc.eventId !== EventRecordEntry.EVENT_ID_REJECT) {
            this.recordEvent(desc); // Record the event.
        }
    }

}
Object.freeze(GameEvents.prototype);
