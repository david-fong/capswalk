import { Lang } from "lang/Lang";
import { BalancingScheme } from "lang/LangSeqTreeNode";

import { Coord, Tile } from "floor/Tile";
import { Grid } from "floor/Grid";

import { Player } from "./player/Player";
import { PuppetPlayer } from "./player/PuppetPlayer";
import { HumanPlayer } from "./player/HumanPlayer";
import { ArtificialPlayer } from "./player/ArtificialPlayer";

import { PlayerGeneratedRequest } from "./events/EventRecordEntry";
import { PlayerMovementEvent } from "./events/PlayerMovementEvent";
import { Bubble } from "./events/Bubble";
import { EventRecordEntry } from "./events/EventRecordEntry";


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
export abstract class Game<S extends Coord.System> extends Grid<S> {

    public readonly lang: Lang;

    /**
     * NOTE: While this is a field, shuffling operations and the
     * {@link Lang} implementation are able to support mid-game changes
     * to the balancing behaviour. Making it fixed for the lifetime of
     * a `Game` is a choice I made in order to make the user experience
     * more simple. It's one less thing they'll see in the in-game UI,
     * and I don't think they'd feel it were missing.
     */
    protected readonly langBalancingScheme: BalancingScheme;

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
     * Set to `undefined` for {@link ServerGame}.
     */
    public readonly operator?: HumanPlayer<S>;

    /**
     * Does not use the HumanPlayer type annotation. This is to
     * indicate that a `Game` does not explicitly care about the
     * unique properties of a {@link HumanPlayer} over a regular
     * {@link Player}.
     */
    private readonly allHumanPlayers: ReadonlyArray<Player<S>>;

    private readonly allArtifPlayers: ReadonlyArray<Player<S>>;

    public abstract get gameType(): Game.Type;



    /**
     * _Does not call reset._
     * 
     * Sets the `idNumber` field in each {@link PlayerDesc} in `desc`.
     * 
     * Performs the "no invincible player" check (See {@link Player#teamSet}).
     * 
     * @override
     */
    public constructor(desc: Game.CtorArgs<S, any>) {
        super(desc.coordSys, desc.gridDimensions);

        // TODO: set default language (must be done before call to reset):
        //this.lang = import(desc.languageName);

        // NOTE: This is implementation specific. If the code is ever
        // made to handle more complex connections (Ex. hexagon tiling
        // or variable neighbours through graph structures), then this
        // must change to account for that.
        // TODO: make this static information so the UI can grey out incompatible
        // lang / floor-tiling combinations. Ie. move this check to the UI code.
        // if (this.lang.numLeaves < this.MAX_NUM_U2NTS) {
        //     throw new Error(`Found ${this.lang.numLeaves}, but at least`
        //         + ` ${this.MAX_NUM_U2NTS} were required. The provided mappings`
        //         + ` composing the current Lang-under-construction are not`
        //         + ` sufficient to ensure that a shuffling operation will always`
        //         + ` be able to find a safe candidate to use as a replacement.`
        //         + ` Please see the spec for ${Lang.prototype.getNonConflictingChar.name}.`
        //     );
        // }
        this.langBalancingScheme = desc.langBalancingScheme;
        this.eventRecord = [];

        // Construct players:
        const playerBundle = this.createPlayers(desc.playerDescs, desc.operatorIndex);
        this.operator = playerBundle.operator;
        this.allHumanPlayers = playerBundle.allHumanPlayers;
        this.allArtifPlayers = playerBundle.allArtifPlayers;

        // Check to make sure that none of the players are invincible:
        // (this happens if a player is "subscribed" to every team number)
        {
            ;
        }
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
        this.forEachTile(this.shuffleLangCharSeqAt, this);

        this.allHumanPlayers.forEach((player) => player.reset());
        this.allArtifPlayers.forEach((player) => player.reset());

        // TODO: spawn players and targets:
        // While not necessary, targets should be done after players have
        // spawned so they do not spawn under players.
    }



    /**
     * Private helper for the constructor.
     * 
     * Assigns player ID's.
     * 
     * @param playerDescs - 
     * @param operatorIndex - 
     * @returns A bundle of the constructed players.
     */
    private createPlayers(
        playerDescs: Game.CtorArgs<S, any>["playerDescs"],
        operatorIndex?: number
    ): {
        operator?: HumanPlayer<S>,
        allHumanPlayers: ReadonlyArray<Player<S>>,
        allArtifPlayers: ReadonlyArray<Player<S>>,
    } {
        let operator: HumanPlayer<S> | undefined = undefined;
        const allHumanPlayers: Array<Player<S>> = [];
        const allArtifPlayers: Array<Player<S>> = [];

        const socketIdToPlayerIdMap: Record<string, Player.Id> = {};
        playerDescs.forEach((playerDesc) => {
            // First pass - Assign Player ID's:
            if (playerDesc.operatorClass < Player.Operator.HUMAN) {
                throw new RangeError("Invalid operator class.");
            }
            // Allocate a player ID.
            playerDesc.idNumber = (playerDesc.operatorClass === Player.Operator.HUMAN)
                ? +(1 + allHumanPlayers.length) + Player.Id.NULL
                : -(1 + allArtifPlayers.length) + Player.Id.NULL;
            if (playerDesc.socketId) {
                socketIdToPlayerIdMap[playerDesc.socketId] = playerDesc.idNumber;
            }
        });
        playerDescs.forEach((playerDesc) => {
            // Second pass - map any socket ID's in `beNiceTo` to player ID's:
            playerDesc.beNiceTo = playerDesc.beNiceTo.map((socketId) => {
                return socketIdToPlayerIdMap[socketId];
            });
        });
        (playerDescs as Game.CtorArgs<S, Player.Id>["playerDescs"]).forEach((playerDesc, index) => {
            // Third pass - Create the Players:
            // Note above redundant `<Player.Id>` as a reminder that
            // the player ID's ahve now been successfully assigned.
            const id = playerDesc.idNumber!;
            if (index === operatorIndex) {
                if (playerDesc.operatorClass !== Player.Operator.HUMAN) {
                    throw new TypeError("Operator must be of the human-operated class.");
                }
                // Found the operator. Note: this will never happen for
                // a ServerGame instance, which sets this to `undefined`.
                operator = this.createOperatorPlayer(playerDesc);
                allHumanPlayers[id] = operator;
            } else {
                if (playerDesc.operatorClass === Player.Operator.HUMAN) {
                    // Human-operated players (except for the operator)
                    // are represented by a `PuppetPlayer`-type object.
                    allHumanPlayers[id] = new PuppetPlayer(this, playerDesc);
                } else {
                    // Artificial players' representation depends on the
                    // Game implementation type. We have an abstract method
                    // expressly for that purpose:
                    allArtifPlayers[id] = this.createArtifPlayer(playerDesc);
                }
            }
        });
        return {
            operator,
            allHumanPlayers,
            allArtifPlayers,
        };
    }

    /**
     * Called automatically in the constructor for this class. This
     * method should not add the produced player to the game's
     * {@link Game#allHumanPlayers} array or set the game's
     * {@link Game#operator}.
     * 
     */
    protected abstract createOperatorPlayer(desc: Player.CtorArgs<any>): HumanPlayer<S>;

    /**
     * @returns An {@link ArtificialPlayer} of the specified type.
     * This is overridden in {@link ClientGame} to throw an error.
     * 
     * @param desc - 
     */
    protected createArtifPlayer(
        desc: Player.CtorArgs,
    ): PuppetPlayer<S> | ArtificialPlayer<S> {
        return ArtificialPlayer.of(this, desc);
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
    private shuffleLangCharSeqAt(tile: Tile<S>): Lang.CharSeqPair {
        // Clear values for the target tile so its current (to-be-
        // previous) values don't get unnecessarily avoided.
        tile.setLangCharSeq(Lang.CharSeqPair.NULL);
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
    private checkIncomingPlayerRequestId(desc: PlayerGeneratedRequest): Player<S> | null { // TODO: no null please
        const player = this.getPlayerById(desc.playerId);
         if (player.isBubbling) {
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
        if (!player) {
            // Player is still bubbling. Reject the request:
            this.processMoveExecute(desc);
            return;
        }
        const dest: Tile<S> = this.getBenchableTileAt(desc.destPos, desc.playerId);
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
        const player = this.getPlayerById(desc.playerId);
        const dest: Tile<S> = this.getBenchableTileAt(desc.destPos, desc.playerId);
        const executeBasicTileUpdates = (): void => {
            // The `LangCharSeqPair` shuffle changes must take effect
            // before updating the operator's seqBuffer if need be.
            if (dest !== player.benchTile && desc.newCharSeqPair) {
                // Don't change this value for bench tiles:
                dest.setLangCharSeq(desc.newCharSeqPair);
            }
            // Refresh the operator's `seqBuffer`:
            if (this.operator && // Ignore if ServerGame
                player.idNumber !== this.operator.idNumber &&
                dest.pos.infNorm(this.operator.pos) === 1) {
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
            // should happen regardless of the order of receipt.
            player.score = desc.playerScore!;
            player.stockpile = desc.playerStockpile!;

            player.moveTo(dest);
            // Below is computationally the same as "(player.lastAcceptedRequestId)++"
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
            while (neighbourQueue.length > 0) {
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

        const desc = new Bubble.PopEvent(bubbler.idNumber);

        desc.playersToDown = jumpNeighbours.filter((player) => {
            return true; // TODO
        }).map((player) => player.idNumber);

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
    protected processBubblePopExecute(desc: Readonly<Bubble.PopEvent>): void {
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
        Object.entries(desc.playersToFreeze).forEach(([ enemyId, duration, ]) => {
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
    protected freezePlayer(player: Player<S>, duration: number): void { }



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

    /**
     * @returns The tile at `dest`, or the specified player's {@link Player#benchTile}
     * @param dest - 
     * @param playerId - IMPORTANT: Must be a valid player.
     */
    public getBenchableTileAt(dest: Coord.Bare<S>, playerId: Player.Id): Tile<S> {
        return ((Player.BENCH_POS[this.coordSys].equals(dest))
            ? this.getPlayerById(playerId).benchTile
            : this.getTileAt(dest)
        );
    }

    /**
     * @param playerId - The ID of an existing player.
     * @returns The {@link Player} with ID `playerId`.
     * @throws RangeError if the specified {@link Player} doesn't exist.
     */
    protected getPlayerById(playerId: Player.Id): Player<S> {
        if (playerId === Player.Id.NULL) {
            throw new RangeError(`The ID \"${Player.Id.NULL}\" is reserved to mean \"no player\".`);
        }
        const player: Player<S> = ((playerId < Player.Id.NULL)
            ? this.allArtifPlayers[(-playerId) - 1]
            : this.allHumanPlayers[(+playerId) - 1]
        );
        if (!player) {
            throw new RangeError(`There is no player in this game with id \"${playerId}\".`);
        } else {
            return player;
        }
    }

    /**
     * @returns All {@link Player}s within a `radius` infinity-norm of
     *      `pos`.
     * 
     * @param pos - 
     * @param radius - defaults to one.
     */
    public getNeighbours(pos: Coord.Bare<S>, radius: number = 1): Array<Player<S>> {
        return this.getNeighbouringTiles(pos, radius)
            .filter((tile) => tile.isOccupied)
            .map((tile) => this.getPlayerById(tile.occupantId));
    }

}



export namespace Game {

    export enum Type {
        OFFLINE,
        SERVER,
        CLIENT,
    }

    /**
     * 
     */
    export type CtorArgs<S extends Coord.System, ID_TYPE extends Player.Id | Player.SocketId = Player.Id> = {

        readonly coordSys: S;

        readonly gridDimensions: Readonly<Grid.DimensionDesc>;

        readonly languageName: typeof Lang.Modules.NAMES[number];

        readonly langBalancingScheme: BalancingScheme;

        /**
         * The index in `playerDescs` of the operator's ctor args.
         * 
         * This should be set to `undefined for a {@link ServerGame}.
         */
        operatorIndex?: number;

        readonly playerDescs: ReadonlyArray<Player.CtorArgs<ID_TYPE>>;
    };
    export namespace CtorArgs {

        export const EVENT_NAME = "game-create";

        /**
         * Not used here, but used in {@link GroupSession#createGameInstance}.
         */
        export type FailureReasons = Partial<{
            undefinedUsername: Array<Player.SocketId>; // socket ID's
        }>;
    }

}
