import { Coord, Tile } from "floor/Tile";

import { Player } from "../player/Player";

import { PlayerGeneratedRequest } from "../events/EventRecordEntry";
import { PlayerMovementEvent } from "../events/PlayerMovementEvent";
import { Bubble } from "../events/Bubble";
import { EventRecordEntry } from "../events/EventRecordEntry";

import { GameBase } from "./Base";
import { Game } from "../Game";


/**
 * 
 */
export abstract class GameEvents<G extends Game.Type, S extends Coord.System.GridCapable> extends GameBase<G,S> {

    /**
     * All copies of the game should contain identical entries. That
     * in a {@link ClientGame} may at any instant be missing trailing
     * entries, or contain some trailing holes, but such gaps should
     * eventually be filled to match those in the Game Manager.
     * 
     * Do not modify this directly. To register an accepted event,
     * call the {@link Game#recordEvent} method, passing it the event
     * descriptor. To get a new event ID, just take the current length
     * of this array.
     */
    protected readonly eventRecord: Array<Readonly<EventRecordEntry>>;

    public constructor(desc: Game.CtorArgs<G,S>, tileClass: Tile.ClassIf<S>) {
        super(desc, tileClass);
        this.eventRecord = [];
    }

    public reset(): void {
        // Clear the event record:
        this.eventRecord.splice(0);

        super.reset();
    }


    /**
     * 
     * @param desc - 
     * @returns The player specified by the given ID, or a falsy value
     *      if the player is still bubbling, in which case the request
     *      should probably be rejected.
     * @throws `RangeError` if the request was made before receiving an
     *      acknowledgement for the previous request, or if the given
     *      ID does not belong to any existing player.
     */
    private checkIncomingPlayerRequestId(desc: PlayerGeneratedRequest): Player<S> | undefined {
        const player = this.getPlayerById(desc.playerId);
         if (player.isBubbling) {
            // The specified player does not exist or is bubbling.
            // This is _not_ the same as if the requester has their
            // movement frozen.
            return undefined;

        } else if (desc.lastAcceptedRequestId !== player.lastAcceptedRequestId) {
            throw new RangeError((desc.lastAcceptedRequestId < player.lastAcceptedRequestId)
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
        if (id === EventRecordEntry.REJECT) {
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



    /**
     * @see PlayerMovementEvent
     * 
     * Call for a {@link HumanPlayer} whose {@link HumanPlayer#seqBuffer}
     * should be that of the {@link Tile} at `dest`. Reject the request
     * by returning `null` if `dest` is occupied, or if the player
     * specified by the given id does not exist, or if the requester has
     * not yet received updates for the destination they requested to
     * move to, or the requester is still bubbling.
     * 
     * Does not actually make any modifications to any part of the game
     * state, and instead, delegates the execution of all necessitated
     * changes to {@link Game#processMoveExecute}.
     * 
     * Should never be called by {@link ClientGame}.
     * 
     * @param desc - A descriptor of the request, with fields indicating
     *      the requester's views of critical parts of the game-state
     *      from their copy of the game-state at the time of the request.
     *      Is modified to describe changes to be made.
     */
    public processMoveRequest(desc: PlayerMovementEvent<S>): void {
        const player = this.checkIncomingPlayerRequestId(desc);
        if (!player) {
            // Player is still bubbling. Reject the request:
            this.processMoveExecute(desc);
            return;
        }
        const dest = this.getBenchableTileAt(desc.dest.coord);
        if (dest.isOccupied ||
            dest.numTimesOccupied !== desc.dest.numTimesOccupied) {
            // The occupancy counter check is not essential, but it helps
            // enforce stronger client-experience consistency: they cannot
            // move somewhere where they have not realized the `LangSeq` has
            // changed.
            this.processMoveExecute(desc);
            return;
        }

        /**
         * Set response fields according to spec in `PlayerMovementEvent`:
         */
        desc.lastAcceptedRequestId = (1 + player.lastAcceptedRequestId);
        desc.dest.numTimesOccupied = (1 + dest.numTimesOccupied);

        const bubbleDesc = Bubble.computeTimerDuration(player);
        // This allows the player's stockpile to increase if its
        // original stockpile value is not such that its calculated
        // timer is outside the required range.
        desc.score = {
            value: player.score + dest.scoreValue,
            stockpile: player.stockpile + (bubbleDesc.performedConstrain ? 0 : dest.scoreValue),
            bubblePercentCharged: bubbleDesc.percentCharged,
        };

        desc.dest.newCharSeqPair = this.shuffleLangCharSeqAt(dest);

        // We are all go! Do it.
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
     * It is essential that for these implementations, this method is
     * not scheduled for later since it is the "write" stage of that
     * critical operation. If I am a {@link ServerGame}, also notify
     * all clients of the movement event.
     * 
     * Updates that are received after others that are more recent and
     * concern the same {@link Tile} are ignored. This is okay since
     * the only thing that matters about a {@link Tile} to the outside
     * world is its last known state.
     * 
     * Updates the event record if the response is accepted.
     * 
     * @param desc - A descriptor for all changes mandated by the
     *      player-movement event.
     */
    public processMoveExecute(desc: Readonly<PlayerMovementEvent<S>>): void {
        const player = this.getPlayerById(desc.playerId);
        const dest = this.getBenchableTileAt(desc.dest.coord);
        const executeBasicTileUpdates = (): void => {
            this.recordEvent(desc);
            // The `LangCharSeqPair` shuffle changes must take effect
            // before updating the operator's seqBuffer if need be.
            dest.setLangCharSeq(desc.dest.newCharSeqPair!);
            // Refresh the operator's `seqBuffer`:
            if (this.operator && // Ignore if ServerGame
                player !== this.operator &&
                !(this.operator.tile.sourcesTo().get.includes(dest))) {
                // Do this if moving into the vicinity of the operator
                // and the requester is not the operator. This operation
                // is necessary to maintain the `seqBuffer` invariant.
                this.operator.seqBufferAcceptKey(null);
            }
            dest.numTimesOccupied = desc.dest.numTimesOccupied;
            dest.scoreValue = 0;
        };

        const clientEventLag = desc.lastAcceptedRequestId - player.lastAcceptedRequestId;
        if (clientEventLag > 1) {
            // Out of order receipt: Already received more recent request responses.
            if (player === this.operator) {
                throw new Error("Operator will never receive their own updates"
                    + " out of order because they only have one unacknowledged"
                    + " in-flight request.");
            }
            if (dest.numTimesOccupied < desc.dest.numTimesOccupied) {
                executeBasicTileUpdates();
            }
            return;
        }

        // Okay- the response we received is for the specified player's most
        // recent request pending this acknowledgement. We either got accepted
        // or rejected now. If the response is a rejection to the operator,
        // then the below line should be the only change made by this call.
        player.requestInFlight = false;

        if (desc.eventId !== EventRecordEntry.REJECT) {
            // ie. clientEventLag === 0 ||
            // (at Game Manager:) dest.numTimesOccupied > desc.destNumTimesOccupied
            return;

        } else if ((player === this.operator)
            ? (clientEventLag === 1)
            : (clientEventLag <= 1)) {
            executeBasicTileUpdates();
            // If using relative values (which we are not), the below
            // should happen regardless of the order of receipt.
            player.score = desc.score!.value;
            player.stockpile = desc.score!.stockpile;
            player.percentBubbleCharge = desc.score!.bubblePercentCharged;

            player.moveTo(dest);
            // Below is computationally the same as "(player.lastAcceptedRequestId)++"
            player.lastAcceptedRequestId = desc.lastAcceptedRequestId;

        } else {
            throw new RangeError("Apparant negative lag. The operator may"
                + " somehow have tampered with their request counter.");
        }
    }



    /**
     * @see Bubble.MakeEvent
     * 
     * Should never be called by {@link ClientGame}.
     * 
     * @param desc - Is modified to describe changes to be made.
     */
    public processBubbleMakeRequest(desc: Bubble.MakeEvent): void {
        // TODO:
        // if successful, make sure to lower the stockpile field.
        // make an abstract method in the HumanPlayer class called in the top-
        // level input processor for it to trigger this event.
        const bubbler = this.checkIncomingPlayerRequestId(desc);
        if (!bubbler) {
            // Player is still bubbling. Reject the request:
            this.processBubbleMakeExecute(desc);
            return;
        }
        const millis = Bubble.computeTimerDuration(bubbler).value;

        desc.lastAcceptedRequestId  = (1 + bubbler.lastAcceptedRequestId);
        desc.estimatedTimerDuration = millis;

        // We are all go! Do it.
        desc.eventId = this.eventRecord.length;
        this.processBubbleMakeExecute(desc);

        // Schedule the bubble to pop:
        this.setTimeout(this.processBubblePopRequest, millis, bubbler);
    }

    /**
     * 
     * Automatically lowers the {@link Player#requestInFlight} field
     * for the requesting `Player` ~if the arriving event description
     * is the newest one for the specified `Player`.~
     * 
     * Updates the event record if the response is accepted.
     * 
     * @param desc - 
     */
    public processBubbleMakeExecute(desc: Readonly<Bubble.MakeEvent>): void {
        // TODO:
        // Visually highlight the affected tiles for the specified estimate-duration.
        const bubbler = this.getPlayerById(desc.playerId);

        bubbler.requestInFlight = false;

        if (desc.eventId !== EventRecordEntry.REJECT) {
            this.recordEvent(desc); // Record the event.
            bubbler.isBubbling = true;
        } else {
            bubbler.isBubbling = false;
        }
        bubbler.hostTile.setOccupant(bubbler);
    }



    /**
     * Unlike other request processors, this will never fail since it
     * is not triggered on the client's side, and instead, by the Game
     * Manager. Ie. There will never be any issues due to reordering
     * on the way to the Game Manager. Never called externally (hence,
     * the private access modifier).
     * 
     * @param bubbler - 
     */
    private processBubblePopRequest(bubbler: Player<S>): void {
        // First, get the range of covered tiles.
        const jumpNeighbours: Array<Player<S>> = [ bubbler, ]; {
            // Note: Actually used as a stack. It doesn't matter.
            const neighbourQueue = [ bubbler, ];
            while (neighbourQueue.length) {
                const neighbour = neighbourQueue.pop()!;
                neighbour.getNeighbours().filter((jumpPlayer) => {
                    // Filter out neighbours that we have already processed:
                    return !(jumpNeighbours.includes(jumpPlayer))
                        && (true); // TODO: add conditions from the spec here.
                }).forEach((jumpPlayer) => {
                    jumpNeighbours.push(jumpPlayer);
                    neighbourQueue.push(jumpPlayer);
                });
            }
            // Last step: remove the first element, which is the bubbler.
            jumpNeighbours.shift();
        }

        const desc = new Bubble.PopEvent(bubbler.playerId);

        desc.playersToDown = jumpNeighbours.filter((player) => {
            return true; // TODO
        }).map((player) => player.playerId);

        // desc.playersToRaise  = get in-range    downed players who are     in any of my teams

        // desc.playersToFreeze = get in-range    downed players who are not in any of my teams

        // We are all go! Do it.
        desc.eventId = this.eventRecord.length;
        this.processBubblePopExecute(desc);
    }

    /**
     * 
     * Updates the event record if the response is accepted.
     * 
     * @param desc - 
     */
    public processBubblePopExecute(desc: Readonly<Bubble.PopEvent>): void {
        // Record the event. No need to check acceptance since this
        // kind of event is made in such a way that it is always accepted.
        this.recordEvent(desc);
        const bubbler = this.getPlayerById(desc.bubblerId);

        // Lower the "isBubbling" flags for the player:
        bubbler.isBubbling = false;

        // Enact effects on supposedly un-downed enemy players:
        desc.playersToDown.forEach((enemyId) => {
            const enemy = this.getPlayerById(enemyId);
            enemy.isDowned = true;
        }, this);

        // Enact effects on supposedly downed teammates:
        desc.playersToRaise.forEach((teammateId) => {
            const teammate = this.getPlayerById(teammateId);
            teammate.isDowned = false;
        }, this);

        // Enact effects on players to freeze:
        desc.playersToFreeze.forEach((freezeDesc) => {
            this.freezePlayer(this.getPlayerById(freezeDesc.targetId), freezeDesc.freezeDuration);
        }, this);
        return;
    }

    /**
     * @param player -
     * @param duration -
     */
    // TODO: make abstract. server manages, client displays, offline does both.
    protected freezePlayer(player: Player<S>, duration: number): void;

}
