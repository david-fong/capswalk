import type { Coord, Tile } from "floor/Tile";
import { Game } from "../Game";

import { EventRecordEntry }     from "../events/EventRecordEntry";
import { PlayerActionEvent }    from "../events/PlayerActionEvent";
import type { TileModEvent }    from "../events/PlayerActionEvent";
export { PlayerActionEvent, TileModEvent };

import { GamepartBase } from "./GamepartBase";


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
export abstract class GamepartEvents<G extends Game.Type, S extends Coord.System> extends GamepartBase<G,S> {

    /**
     * All copies of the game should contain identical entries. That
     * in a {@link OnlineGame} may at any instant be missing trailing
     * entries, or contain some trailing holes, but such gaps should
     * eventually be filled to match those in the Game Manager.
     *
     * Do not modify this directly. To register an accepted event,
     * call the {@link Game#recordEvent} method, passing it the event
     * descriptor. To create a new event ID at the Game Manager, just
     * take the current length of this array.
     *
     * This array has a fixed length to put a bound on the amount of
     * memory it consumes. Therefore, any accesses to it must use a
     * wrapped (apply modulus operator) version of event ID's. Event
     * ID's are _not_ wrapped in their representation.
     */
    private readonly eventRecordBitmap: Array<boolean>;
    #nextUnusedEventId: EventRecordEntry["eventId"];

    public constructor(
        gameType: G,
        impl:     Game.ImplArgs<G,S>,
        gameDesc: Game.CtorArgs<G,S>,
    ) {
        super(gameType, impl, gameDesc);
        this.eventRecordBitmap = [];
    }

    public reset(): Promise<void> {
        const superPromise = super.reset();

        // Clear the event record:
        this.eventRecordBitmap.fill(false, 0, Game.K.EVENT_RECORD_WRAPPING_BUFFER_LENGTH);
        this.#nextUnusedEventId = 0;

        // Since we didn't wait for the superPromise, return it.
        return superPromise;
    }

    protected get nextUnusedEventId(): EventRecordEntry["eventId"] {
        return this.#nextUnusedEventId;
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
    private _recordEvent(desc: Readonly<EventRecordEntry>): void {
        const id = desc.eventId;
        const wrappedId = id % Game.K.EVENT_RECORD_WRAPPING_BUFFER_LENGTH;
        if (id === EventRecordEntry.EVENT_ID_REJECT) {
            throw new TypeError("Do not try to record events for rejected requests.");
        } else if (id < 0 || id !== Math.trunc(id)) {
            throw new RangeError("Event ID's must only be assigned positive, integer values.");
        } else if (this.eventRecordBitmap[wrappedId]) {
            throw new Error("Event ID's must be assigned unique values.");
        }
        // TODO.impl Check for an OnlineGame that it is not far behind the Server.
        // also design what should be done to handle that... Do we really need to
        // recover from that?
        this.eventRecordBitmap[wrappedId] = true;
        this.eventRecordBitmap[(id
            + Game.K.EVENT_RECORD_WRAPPING_BUFFER_LENGTH
            - Game.K.EVENT_RECORD_FORWARD_WINDOW_LENGTH)
            % Game.K.EVENT_RECORD_WRAPPING_BUFFER_LENGTH] = false;
            this.#nextUnusedEventId++;
    }


    protected executeTileModEvent(
        desc: Readonly<TileModEvent<S>>,
        doCheckOperatorSeqBuffer: boolean = true,
    ): Tile<S> {
        Object.freeze(desc);
        const dest = this.grid.tile.at(desc.coord);
        if (dest.lastKnownUpdateId  >  desc.lastKnownUpdateId) return dest;
        if (dest.lastKnownUpdateId === desc.lastKnownUpdateId) throw new RangeError("never");

        if (desc.newCharSeqPair) {
            dest.setLangCharSeqPair(desc.newCharSeqPair);
            // Refresh the operator's `seqBuffer` (maintain invariant) for new CSP:
            if (doCheckOperatorSeqBuffer) {
                // ^Do this when non-operator moves into the the operator's vicinity.
                this.operators.filter((op) => {
                    return op.tile.destsFrom().get.includes(dest);
                }).forEach((op) => op.seqBufferAcceptKey(""));
            }
        }
        dest.lastKnownUpdateId = desc.lastKnownUpdateId;
        dest.freeHealth = desc.newFreeHealth!;
        return dest;
    }

    /**
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
    protected executePlayerMoveEvent(desc: Readonly<PlayerActionEvent.Movement<S>>): void {
        // console.log(desc);
        const player = this.players[desc.playerId];
        const clientEventLag = desc.playerLastAcceptedRequestId - player.lastAcceptedRequestId;

        if (desc.eventId === EventRecordEntry.EVENT_ID_REJECT) {
            // Rejected request. Implies either that: clientEventLag === 0,
            // or that (at Game Manager): dest.numTimesOccupied > desc.destNumTimesOccupied
            if (clientEventLag === 0) {
                player.requestInFlight = false;
            }
            return; // Short-circuit!
        }
        this._recordEvent(desc);
        const dest = this.executeTileModEvent(desc.destModDesc, player !== this.currentOperator);
        desc.tileHealthModDescs?.forEach((desc) => {
            this.executeTileModEvent(desc);
        });

        if (clientEventLag > 1) {
            // ===== Out of order receipt (clientside) =====
            // Already received more recent request responses.
            if (player === this.currentOperator) {
                // Operator never receives their own updates out of
                // order because they only have one unacknowledged
                // in-flight request at a time.
                throw new Error("never");
            }
            return; // Short-circuit!
        }
        // Okay- the response is an acceptance of the specified player's most
        // recent request pending this acknowledgement.
        player.requestInFlight = false;
        if ((player === this.currentOperator)
            ? (clientEventLag === 1)
            : (clientEventLag <= 1)) {
            player.status.health = desc.newPlayerHealth!.health;

            player.moveTo(dest);
            // Below is computationally the same as "(player.lastAcceptedRequestId)++"
            player.lastAcceptedRequestId = desc.playerLastAcceptedRequestId;

        } else {
            // Apparent negative lag. The operator may somehow have
            // tampered with their player's request counter.
            throw new RangeError("never");
        }
    }


    /**
     *
     * Automatically lowers the {@link Player#requestInFlight} field
     * for the requesting `Player`.
     *
     * @param desc -
     */
    protected executePlayerBubbleEvent(desc: Readonly<PlayerActionEvent.Bubble>): void {
        const bubbler = this.players[desc.playerId];

        bubbler.requestInFlight = false;

        if (desc.eventId !== EventRecordEntry.EVENT_ID_REJECT) {
            this._recordEvent(desc); // Record the event.
        }
    }

}
Object.freeze(GamepartEvents);
Object.freeze(GamepartEvents.prototype);