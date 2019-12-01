import { Lang } from "src/lang/Lang";
import { BalancingScheme } from "src/lang/LangSeqTreeNode";
import { BarePos, Tile } from "src/base/Tile";
import { GridDimensionDesc, Grid } from "src/base/Grid";

import { PlayerId, Player } from "src/base/player/Player";
import { ArtificialPlayer } from "src/base/player/ArtificialPlayer";
import { HumanPlayer } from "src/base/player/HumanPlayer";

import { PlayerGeneratedRequest } from "src/events/PlayerGeneratedRequest";
import { PlayerMovementEvent } from "src/events/PlayerMovementEvent";
import { Bubble } from "src/events/Bubble";
import { EventRecordEntry } from "src/events/EventRecordEntry";

export { GridDimensionDesc, Grid } from "src/base/Grid";


/**
 * 
 * 
 * This class performs the majority of management over {@link Tile}
 * and {@link Player} objects. As a design choice, players can only join
 * a game before it starts, and actions such as changing the language or
 * difficulty require a restart. These actions that require a restart will
 * all be exposed to operators through a pre-game page. Other such actions
 * include: changing teams.
 * 
 * An overview of subclasses:
 * Both {@link ClientGame} and {@link OfflineGame} use {@link VisualTile}s
 * while {@link ServerGame} uses {@link ServerTile}s. {@link ClientGame}'s
 * record of the state of the game comes completely from {@link ServerGame}.
 * 
 * There are overlaps between what each implementation needs to do:
 * - Offline and Server games maintain and control the master-game-state.
 * - Offline and Client games display the game-state to an operator via browser and HTML.
 * - Client  and Server games use network operations to communicate.
 * 
 * @extends Grid
 */
export abstract class Game extends Grid {

    public lang: Lang;

    /**
     * Set to `undefined` for {@link ServerGame}
     * 
     * TODO: initialize this field in constructor. Consider tightening access modifier.
     */
    public readonly operator: HumanPlayer;

    /**
     * Does not use the HumanPlayer type annotation. This is to
     * indicate that a `Game` does not explicitly care about the
     * unique properties of a {@link HumanPlayer} over a regular
     * {@link Player}.
     */
    private readonly allHumanPlayers: ReadonlyArray<Player>;

    private readonly allArtifPlayers: ReadonlyArray<Player>;

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
    private readonly eventRecord: Array<Readonly<EventRecordEntry>>;



    /**
     * TODO: change the player arrays to be constructor arguments. Not
     * sure about the aritifial players. But definitely the human ones.
     * 
     * _Does not call reset._
     * 
     * @override
     */
    public constructor(dimensions: GridDimensionDesc) {
        super(dimensions);

        // TODO: set default language (must be done before call to reset):
        this.lang = null;

        // TODO: setup allHumanPlayers?
        this.allHumanPlayers = [];
        this.allArtifPlayers = [];

        this.eventRecord = [];
    }

    /**
     * Reset the grid and the language hit-counters, performs language
     * sequence shuffle-ins, respawns players, and spawns in targets.
     * 
     * @override {@link Grid#reset}
     */
    public reset(): void {
        super.reset();

        // Clear the event record:
        this.eventRecord.splice(0);

        // Reset hit-counters in the current language:
        // This must be done before shuffling so that the previous
        // history of shuffle-ins has no effects on the new pairs.
        this.lang.reset();

        // Shuffle everything:
        this.grid.forEach((row) => row.forEach((tile) => {
            this.shuffleLangCharSeqAt(tile);
        }, this), this);

        this.allHumanPlayers.forEach((player) => player.reset());
        this.allArtifPlayers.forEach((player) => player.reset());

        // TODO: spawn players and targets:
        // While not necessary, targets should be done after players have
        // spawned so they do not spawn under players.
    }



    /**
     * Helper for {@link Game#processMoveRequest}. Does execute usage
     * of the returned values, which is expected to be done externally.
     * However, this method will nullify the existing values at `tile`.
     * 
     * @param tile - The {@link Tile} to shuffle their {@link LangChar}-
     *      {@link LangSeq} pair for.
     * @returns A {@link LangCharSeqPair} that can be used as a replacement
     *      for that currently being used by `tile`.
     */
    private shuffleLangCharSeqAt(tile: Tile): Lang.CharSeqPair {
        // Clear values for the target tile so its current (to-be-
        // previous) values don't get unnecessarily avoided.
        tile.setLangCharSeq(Lang.EMPTY_CSP);
        return this.lang.getNonConflictingChar(
            this.getNeighbouringTiles(tile.pos)
                .map((tile) => tile.langSeq)
                .filter((seq) => seq), // no falsy values.
            this.langBalancingScheme,
        );
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
    private checkIncomingPlayerRequestId(desc: PlayerGeneratedRequest): Player | null {
        const player = this.getPlayerById(desc.playerId);
        if (!player) {
            throw new RangeError(`No player with the ID ${desc.playerId} exists.`);

        } else if (player.isBubbling) {
            // The specified player does not exist or is bubbling.
            // This is _not_ the same as if the requester has their
            // movement frozen.
            return null;

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
    public processMoveRequest(desc: PlayerMovementEvent): void {
        const player = this.checkIncomingPlayerRequestId(desc);
        if (!(player)) {
            // Player is still bubbling. Reject the request:
            this.processMoveExecute(desc);
            return;
        }
        const dest: Tile = this.getBenchableTileAt(desc.destPos, desc.playerId);
        if (dest.isOccupied() ||
            dest.numTimesOccupied !== desc.destNumTimesOccupied) {
            // The check concerning the destination `Tile`'s occupancy
            // counter is not absolutely necessary. It does not enforce
            // stronger invariant-keeping consistency, but it does enforce
            // stronger client-experience consistency: they cannot move
            // somewhere where they have not realized the `LangSeq` has
            // changed.
            this.processMoveExecute(desc);
            return;
        }

        /**
         * Set response fields according to spec in `PlayerMovementEvent`:
         */
        desc.lastAcceptedRequestId = (1 + player.lastAcceptedRequestId);
        desc.destNumTimesOccupied  = (1 + dest.numTimesOccupied);

        desc.playerScore = (player.score + dest.scoreValue);
        if (Bubble.computeTimerDuration(player).performedConstrain) {
            // This allows the player's stockpile to increase if its
            // original stockpile value is not such that its calculated
            // timer is outside the required range.
            desc.playerStockpile = (player.stockpile + dest.scoreValue);
        }

        desc.newCharSeqPair = this.shuffleLangCharSeqAt(dest);

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
    public processMoveExecute(desc: Readonly<PlayerMovementEvent>): void {
        const dest: Tile = this.getBenchableTileAt(desc.destPos, desc.playerId);
        const player = this.getPlayerById(desc.playerId);
        const executeBasicTileUpdates = (): void => {
            // The `LangCharSeqPair` shuffle changes must take effect
            // before updating the operator's seqBuffer if need be.
            if (dest !== player.benchTile) {
                // Don't change this value for bench tiles:
                dest.setLangCharSeq(desc.newCharSeqPair);
            }
            // Refresh the operator's `seqBuffer`:
            if (this.operator && // Ignore if ServerGame
                player.idNumber !== this.operator.idNumber &&
                dest.pos.sub(this.operator.pos).infNorm === 1) {
                // Do this if moving into the vicinity of the operator
                // and the requester is not the operator. This operation
                // is necessary to maintain the `seqBuffer` invariant.
                this.operator.seqBufferAcceptKey(null);
            }
            dest.numTimesOccupied = desc.destNumTimesOccupied;
        };

        const playerLagState = desc.lastAcceptedRequestId - player.lastAcceptedRequestId;
        if ((playerLagState > 1) ||
            (dest.numTimesOccupied > desc.destNumTimesOccupied)) {
            // We have received even more recent updates already. This update
            // arrived out of order. The `Tile` occupancy counter should still
            // be updated if increasing, which will happen if this is an older
            // player movement. The rest of the event's effects can be ignored
            // as move operations for `Player`s are transitive in nature.
            if (dest.numTimesOccupied < desc.destNumTimesOccupied) {
                executeBasicTileUpdates();
            }
            return;
        }

        // Okay- the response we received is for the specified player's most
        // recent request pending this acknowledgement. We either got accepted
        // or rejected now. If the response is a rejection to the operator,
        // then the below line should be the only change made by this call.
        player.requestInFlight = false;

        if (playerLagState === 0) {
            // The request was rejected by the Game Manager. That is,
            // the response's id is unchanged. No need to assign it
            // into this local copy of the last accepted request.
            if (desc.eventId !== EventRecordEntry.REJECT) {
                throw new Error("This should never happen.");
            }
            return;

        } else if (playerLagState === 1) {
            this.recordEvent(desc); // Record the event.
            executeBasicTileUpdates();
            // If using relative values (which we are not), the below
            // should happen regardless of the order of receipt. These
            // values are currently never modified unless the request
            // succeeds, so they could technically go in the "else if"
            // block.
            player.score = desc.playerScore;
            player.stockpile = desc.playerStockpile;

            player.moveTo(dest);
            // Below is the same as "(player.lastAcceptedRequestId)++"
            player.lastAcceptedRequestId = desc.lastAcceptedRequestId;

        } else {
            throw new RangeError("The client seems to have tampered with their request counter.");
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
        // if successful, make sure to lower the (score? and) stockpile fields.
        // make an abstract method in the HumanPlayer class called in the top-
        // level input processor for it to trigger this event.
        const bubbler: Player = this.checkIncomingPlayerRequestId(desc);
        if (!(bubbler)) {
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
    private processBubblePopRequest(bubbler: Player): void {
        const desc = new Bubble.PopEvent(bubbler.idNumber);
        // TODO
        // first, get the range of covered tiles.
        // desc.playersToDown   = get in-range un-downed players who are not in any of my teams. extend range to prevent turtling.
        // desc.playersToFreeze = get in-range    downed players who are not in any of my teams
        // desc.playersToRaise  = get in-range    downed players who are     in any of my teams

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
    protected processBubblePopExecute(desc: Readonly<Bubble.PopEvent>): void {
        // Record the event. No need to check acceptance since this
        // kind of event is made in such a way that it is always accepted.
        this.recordEvent(desc);
        const bubbler: Player = this.getPlayerById(desc.bubblerId);

        // Lower the "isBubbling" flags for the player:
        this.recordEvent(desc);
        bubbler.isBubbling = false;

        // Enact effects on supposedly un-downed enemy players:
        desc.playersToDown.forEach((enemyId) => {
            const enemy: Player = this.getPlayerById(enemyId);
            enemy.isDowned = true;
        }, this);

        // Enact effects on supposedly downed teammates:
        desc.playersToRaise.forEach((teammateId) => {
            const teammate: Player = this.getPlayerById(teammateId);
            teammate.isDowned = false;
        }, this);

        // Enact effects on 
        Object.entries(desc.playersToFreeze).forEach(([enemyId, duration,]) => {
            this.freezePlayer(this.getPlayerById(parseInt(enemyId)), duration);
        }, this);
        return;
    }

    /**
     * TODO: make abstract. server manages, client displays, offline does both.
     * 
     * @param player - 
     * @param duration - 
     */
    protected freezePlayer(player: Player, duration: number): void { }



    /**
     * Basically does `this.eventRecord[id] = desc;` with value checking.
     * 
     * @param desc - 
     * @throws TypeError if the event ID indicates a rejected request,
     *      RangeError if it is not a positive integer, and Error if
     *      another event was already recorded with the same ID.
     */
    private recordEvent(desc: EventRecordEntry): void {
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

    public abstract setTimeout(callback: Function, millis: number, ...args: any[]): number | NodeJS.Timeout;

    public abstract cancelTimeout(handle: number | NodeJS.Timeout): void;

    public getBenchableTileAt(dest: BarePos, playerId: PlayerId): Tile {
        return ((Player.BENCH_POS.equals(dest))
            ? this.getPlayerById(playerId).benchTile
            : this.getTileAt(dest)
        );
    }

    /**
     * 
     * @param playerId - 
     * @returns `null` if the specified `playerId` is not allocated
     *      to any {@link Player} in this `Game`.
     */
    protected getPlayerById(playerId: PlayerId): Player | null {
        if (playerId === 0) {
            throw new RangeError("Zero is reserved to mean \"no player\".");
        }
        const player: Player = ((playerId < 0)
            ? this.allArtifPlayers[(-playerId) - 1]
            : this.allHumanPlayers[( playerId) - 1]
        );
        return (player) ? player : null;
    }

    protected get langBalancingScheme(): BalancingScheme {
        // TODO
        //return this.settings.langBalancingScheme.selectedValue;
        return undefined;
    }

}



/**
 * TODO: move this class to its own file.
 */
export class GameStateDump {

    public static readonly EVENT_NAME = "dump game state";

    public constructor(game: Game) {
        ;
    }
}
