import type { Coord, Tile } from "floor/Tile";
import type { Player } from "../player/Player";
import { Game } from "../Game";

import { PlayerGeneratedRequest } from "../events/EventRecordEntry";
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
        tileClass: Tile.ClassIf<S>,
        gameDesc: Game.CtorArgs<G,S>,
    ) {
        super(gameType, tileClass, gameDesc);
        this.eventRecord = [];
    }

    public reset(): void {
        // Clear the event record:
        this.eventRecord.splice(0);

        super.reset();
    }


    /**
     * Perform checks on an incoming event request for some action that
     * a player can perform while the game is playing (ie. not paused
     * or over).
     *
     * @param desc -
     * @returns
     * The player specified by the given ID, or undefined if the
     * game is not playing, in which case the event request should
     * be rejected.
     *
     * @throws
     * `RangeError` if the request was made before receiving an
     * acknowledgement for the previous request, or if the given ID
     * does not belong to any existing player.
     */
    private managerCheckGamePlayingRequest(desc: PlayerGeneratedRequest): Player<S> | undefined {
        if (this.gameType === Game.Type.CLIENT) {
            throw new TypeError(""
            + "This operation is unsupported for"
            + " non-game-manager implementations.");
        }
        if (this.status !== Game.Status.PLAYING) {
            return undefined;
        }
        const player = this.players.get(desc.playerId);
        if (!player) {
            throw new Error("No such player exists.");
        }
        if (desc.playerLastAcceptedRequestId !== player.lastAcceptedRequestId) {
            throw new RangeError((desc.playerLastAcceptedRequestId < player.lastAcceptedRequestId)
            ? ("Clients should not make requests until they have"
                + " received my response to their last request.")
            : ("Client seems to have incremented the request ID"
                + " counter on their own, which is is illegal.")
            );
        }
        return player;
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
            dest.rawHealthOnFloor  = desc.newRawHealthOnFloor!;
        }
    }



    /**
     * @see PlayerMovementEvent
     *
     * Reject the request if `dest` is occupied, or if the specified
     * player does not exist, or the client is missing updates for the
     * destination they requested to move to, or the player is bubbling.
     *
     * Should never be called by {@link ClientGame}.
     *
     * @param desc
     * A descriptor of the request describing the requester's views
     * of critical parts of the game-state from their copy of the game
     * state at the time of the request. Is modified to describe changes
     * to be made.
     */
    public processMoveRequest(desc: PlayerActionEvent.Movement<S>): void {
        const player = this.managerCheckGamePlayingRequest(desc);
        if (!player) {
            // Reject the request:
            this.processMoveExecute(desc);
            return;
        }
        const dest = this.grid.tile.at(desc.dest.coord);
        if (dest.isOccupied ||
            dest.lastKnownUpdateId !== desc.dest.lastKnownUpdateId) {
            // The occupancy counter check is not essential, but it helps
            // enforce stronger client-experience consistency: they cannot
            // move somewhere where they have not realized the `LangSeq` has
            // changed.
            this.processMoveExecute(desc); // Reject the request.
            return;
        }

        // Set response fields according to spec in `PlayerMovementEvent`:
        desc.playerLastAcceptedRequestId = (1 + player.lastAcceptedRequestId);
        desc.newPlayerHealth = {
            score:     player.status.score     + dest.rawHealthOnFloor,
            rawHealth: player.status.rawHealth + dest.rawHealthOnFloor,
        };
        desc.dest.lastKnownUpdateId = (1 + dest.lastKnownUpdateId);
        desc.dest.newRawHealthOnFloor = 0;
        desc.dest.newCharSeqPair = this.dryRunShuffleLangCharSeqAt(dest);
        // TODO.impl spawn in some new raw health to the floor:
        desc.tilesWithRawHealthUpdates = this.dryRunSpawnRawHealthOnFloor();

        // Accept the request, and trigger calculation
        // and enactment of the requested changes:
        desc.eventId = this.eventRecord.length;
        this.processMoveExecute(desc);
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
        const player = this.players.get(desc.playerId);
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
        desc.tilesWithRawHealthUpdates!.forEach((desc) => {
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
            this.executeTileModificationsEvent(desc.dest, player !== this.operator);
            return; // Short-circuit!
        }
        // Okay- the response is an acceptance of the specified player's most
        // recent request pending this acknowledgement.
        player.requestInFlight = false;
        if ((player === this.operator)
            ? (clientEventLag === 1)
            : (clientEventLag <= 1)) {
            this.executeTileModificationsEvent(desc.dest, player !== this.operator);
            player.status.score     = desc.newPlayerHealth!.score;
            player.status.rawHealth = desc.newPlayerHealth!.rawHealth;

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
     * @see PlayerActionEvent.Bubble
     *
     * Should never be called by {@link ClientGame}.
     *
     * @param desc - Is modified to describe changes to be made.
     */
    public processBubbleMakeRequest(desc: PlayerActionEvent.Bubble): void {
        // TODO.impl
        // - If successful, make sure to lower the health field.
        // - Make an abstract method in the OperatorPlayer class called in
        //   the top-level input processor for it to trigger this event.
        const bubbler = this.managerCheckGamePlayingRequest(desc);
        if (!bubbler) {
            // Reject the request:
            this.processBubbleMakeExecute(desc);
            return;
        }
        desc.playerLastAcceptedRequestId = (1 + bubbler.lastAcceptedRequestId);

        // We are all go! Do it.
        desc.eventId = this.eventRecord.length;
        this.processBubbleMakeExecute(desc);
    }

    /**
     *
     * Automatically lowers the {@link Player#requestInFlight} field
     * for the requesting `Player`.
     *
     * @param desc -
     */
    protected processBubbleMakeExecute(desc: Readonly<PlayerActionEvent.Bubble>): void {
        // TODO.impl Visually highlight the affected tiles for the specified estimate-duration.
        const bubbler = this.players.get(desc.playerId);

        bubbler.requestInFlight = false;

        if (desc.eventId !== EventRecordEntry.EVENT_ID_REJECT) {
            this.recordEvent(desc); // Record the event.
        }
    }

}
