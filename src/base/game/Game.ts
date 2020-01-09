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
 */
export abstract class Game<G extends Game.Type, S extends Coord.System.GridCapable> {

    public readonly gameType: G;

    public readonly tileClass: Tile.ConstructorType<S>;

    public readonly lang: Lang;

    /**
     * NOTE: While this is a field, shuffling operations and the
     * {@link Lang} implementation are able to support mid-game changes
     * to the balancing behaviour. Making it fixed for the lifetime of
     * a `Game` is a choice I made in order to make the user experience
     * more simple. It's one less thing they'll see in the in-game UI,
     * and I don't think they'd feel as if it were missing.
     */
    protected readonly langBalancingScheme: BalancingScheme;

    /**
     * Contains all non-bench tiles in this game.
     */
    public readonly grid: Grid<S>;

    /**
     * 
     */
    private readonly players: Player.Bundle<Player<S>>;

    public readonly operator: G extends Game.Type.SERVER ? undefined : HumanPlayer<S>;

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
     * _Does not call reset._
     * 
     * Sets the `idNumber` field in each {@link PlayerDesc} in `desc`.
     * 
     * Performs the "no invincible player" check (See {@link Player#teamSet}).
     * 
     * @param desc -
     * @param tileClass -
     */
    public constructor(desc: Game.CtorArgs<G,S>, tileClass: Tile.ConstructorType<S>) {
        this.gameType = desc.gameType;
        this.tileClass = tileClass;
        this.grid = Grid.of(desc.coordSys, {
            dimensions: desc.gridDimensions,
            tileClass: this.tileClass,
        });

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
        this.players = this.createPlayers(desc);
        if (desc.operatorIndex) {
            (this.operator as HumanPlayer<S>) = this.getPlayerById({
                operatorClass: Player.Operator.HUMAN,
                intraClassId: desc.operatorIndex!,
            }) as HumanPlayer<S>;
        }

        // Check to make sure that none of the players are invincible:
        // @see Player#beNiceTo
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
        this.grid.reset();

        // Clear the event record:
        this.eventRecord.splice(0);

        // Reset hit-counters in the current language:
        // This must be done before shuffling so that the previous
        // history of shuffle-ins has no effects on the new pairs.
        this.lang.reset();

        // Shuffle everything:
        this.grid.forEachTile(this.shuffleLangCharSeqAt, this);

        for (const sameClassPlayers of Object.values(this.players)) {
            sameClassPlayers.forEach((player) => {
                player.reset();
            });
        }

        // TODO: spawn players and targets:
        // While not necessary, targets should be done after players have
        // spawned so they do not spawn under players.
    }



    /**
     * Private helper for the constructor.
     * 
     * Assigns player ID's.
     * 
     * @param desc -
     * @returns A bundle of the constructed players.
     */
    private createPlayers(
        desc: Readonly<Game.CtorArgs<G,S>>,
    ): Game<G,S>["players"] {
        /**
         * @inheritdoc
         * NOTE: this doc is just here to satisfy some linting warning condition.
         */
        function __assert(desc: Game.CtorArgs<any,S>):
            asserts desc is Readonly<Game.CtorArgs<Game.Type.Manager, S>> {
            if (desc.gameType === Game.Type.CLIENT) {
                throw new TypeError("This must be overriden for an online-client implementation.");
            }
        };
        __assert(desc);

        const players: Partial<Record<Player.Operator, ReadonlyArray<Player<S>>>> = {};
        for (const [ operatorClass, playersCtorArgs, ] of Object.entries(desc.playerDescs)) {
            Player.assertIsOperator(operatorClass);
            players[operatorClass] = playersCtorArgs.map((ctorArgs, index) => {
                if (operatorClass === Player.Operator.HUMAN) {
                    if (index === desc.operatorIndex) {
                        if (this.gameType === Game.Type.SERVER) {
                            throw new TypeError("The operator is not defined on the server side.");
                        }
                        // Found the operator. Note: this will never happen for
                        // a ServerGame instance, which sets this to `undefined`.
                        return this.createOperatorPlayer(ctorArgs);
                    } else {
                        // Human-operated players (except for the operator)
                        // are represented by a `PuppetPlayer`-type object.
                        return new PuppetPlayer(this, ctorArgs);
                    }
                } else {
                    // Artificial players' representation depends on the
                    // Game implementation type. We have an abstract method
                    // expressly for that purpose:
                    return this.createArtifPlayer(ctorArgs);
                }
            });
        }
        return players as Game<G,S>["players"];
    }

    /**
     * Called automatically in the constructor for this class. This
     * method should not add the produced player to the game's
     * {@link Game#allHumanPlayers} array or set the game's
     * {@link Game#operator}.
     * 
     */
    protected abstract createOperatorPlayer(desc: Player.CtorArgs): HumanPlayer<S>;

    /**
     * @returns An {@link ArtificialPlayer} of the specified type.
     * 
     * @param desc -
     */
    protected createArtifPlayer(
        desc: Player.CtorArgs,
    ): PuppetPlayer<S> | ArtificialPlayer<S> {
        return ArtificialPlayer.of(this, desc);
    }



    /**
     * Helper for {@link Game#processMoveRequest}.
     * 
     * **Important:** Does not consume
     * the returned values, which is expected to be done externally.
     * Nullifies the existing values at `tile`.
     * 
     * @param targetTile
     * The {@link Tile} to shuffle their {@link Lang.CharSeqPair}
     * pair for.
     * 
     * @returns
     * A {@link Lang.CharSeqPair} that can be used as a replacement
     * for that currently being used by `tile`.
     */
    public shuffleLangCharSeqAt(targetTile: Tile<S | Coord.System.__BENCH>): Lang.CharSeqPair {
        // TODO: first of all, this should have been specifying the
        // radius argument to be 2. Second, it technically should
        // not even be specifying the radius as two: it should take
        // the set of of all tiles a player can reach from tiles by
        // which a player can reach `targetTile`. This would properly
        // handle directed-graph-type coordinate systems.

        // First, clear values for the target tile so its current
        // (to-be-previous) values don't get unnecessarily avoided.
        targetTile.setLangCharSeq(Lang.CharSeqPair.NULL);

        const benchOwnerId = (targetTile as Tile<Coord.System.__BENCH>).coord.playerId;
        if (benchOwnerId !== undefined) {
            const benchOwner = this.getPlayerById(benchOwnerId);
            return {
                char: benchOwner.playerId.toString(),
                seq: benchOwner.username,
            };
        } else {
            return this.lang.getNonConflictingChar(
                this.grid.getNeighbouringTiles((targetTile as Tile<S>).coord)
                    .map((tile) => tile.langSeq)
                    .filter((seq) => seq), // no falsy values.
                this.langBalancingScheme,
            );
        }
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
    public processMoveRequest(desc: PlayerMovementEvent<S> & Partial<PlayerMovementEvent<Coord.System.__BENCH>>): void {
        const player = this.checkIncomingPlayerRequestId(desc);
        if (!player) {
            // Player is still bubbling. Reject the request:
            this.processMoveExecute(desc);
            return;
        }
        const dest = this.getBenchableTileAt(desc.dest.coord);
        if (dest.isOccupied ||
            dest.numTimesOccupied !== desc.dest.numTimesOccupied) {
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
    public processMoveExecute(desc: Readonly<PlayerMovementEvent<S | Coord.System.__BENCH>>): void {
        const player = this.getPlayerById(desc.playerId);
        const dest = this.getBenchableTileAt(desc.dest.coord);
        const executeBasicTileUpdates = (): void => {
            // The `LangCharSeqPair` shuffle changes must take effect
            // before updating the operator's seqBuffer if need be.
            dest.setLangCharSeq(desc.dest.newCharSeqPair!);
            // Refresh the operator's `seqBuffer`:
            if (this.operator && // Ignore if ServerGame
                player !== this.operator &&
                !(this.grid.getTileSourcesTo(this.operator.coord).includes(dest as Tile<S>))) {
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
            if (player === this.operator) {
                throw new Error("Operator will never receive their own updates"
                    + " late because they only ever have one unacknowledged"
                    + " in-flight request.");
            }
            // We have received even more recent updates already. This update
            // arrived out of order. The `Tile` occupancy counter should still
            // be updated if increasing, which will happen if this is an older
            // player movement. The rest of the event's effects can be ignored
            // as move operations for `Player`s are transitive in nature.
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
            // dest.numTimesOccupied > desc.destNumTimesOccupied
            return;

        } else if ((player === this.operator)
            ? (clientEventLag === 1)
            : (clientEventLag <= 1)) {
            this.recordEvent(desc);
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
        desc.playersToFreeze.forEach((freezeDesc) => {
            this.freezePlayer(this.getPlayerById(freezeDesc.targetId), freezeDesc.freezeDuration);
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
     * 
     * @throws
     * In the given order of priority:
     * - TypeError if the event ID indicates a rejected request
     * - RangeError if it is not a positive integer
     * - Error if another event was already recorded with the same ID.
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

    public abstract setTimeout(callback: Function, millis: number, ...args: any[]): G extends Game.Type.SERVER ? NodeJS.Timeout : number;

    public abstract cancelTimeout(handle: number | NodeJS.Timeout): void;

    /**
     * @returns
     * The tile at `dest`, or the specified player's{@link Player#benchTile}.
     * 
     * @param dest -
     */
    public getBenchableTileAt(
        dest: Coord.Bare<S | Coord.System.__BENCH>,
    ): Tile<S | Coord.System.__BENCH> {
        return ((dest as Coord.Bare<Coord.System.__BENCH>).playerId !== undefined)
            ? this.getPlayerById((dest as Coord.Bare<Coord.System.__BENCH>).playerId).benchTile
            : this.grid.getTileAt(dest as Coord.Bare<S>);
    }

    /**
     * @param playerId - The ID of an existing player.
     * @returns The {@link Player} with ID `playerId`.
     */
    protected getPlayerById(playerId: Player.Id): Player<S> {
        return this.players[playerId.operatorClass][playerId.intraClassId];
    }

    /**
     * @returns
     * All {@link Player}s within a `radius` infinity-norm of `pos`.
     * 
     * @param coord - 
     * @param radius - defaults to one.
     */
    public getNeighbours(coord: Coord.Bare<S>, radius: number = 1): Array<Player<S>> {
        return this.grid.getNeighbouringTiles(coord, radius)
            .filter((tile) => tile.isOccupied)
            .map((tile) => this.getPlayerById(tile.occupantId));
    }

}



export namespace Game {

    export const enum Type {
        OFFLINE = "OFFLINE",
        SERVER  = "SERVER",
        CLIENT  = "CLIENT",
    }
    export namespace Type {
        export type Manager = Type.OFFLINE | Type.SERVER;
    }

    /**
     * # Game Constructor Arguments
     * 
     * @template S
     * The coordinate system to use. The literal value must also be
     * passed as the field {@link CtorArgs#coordSys}.
     * 
     * @template ID
     * The current type of Player ID's. Player ID's are assigned by
     * the `Game` constructor of the Game Manager. On the client side
     * of an online game, these will have been assigned by the server,
     * so it should use the default type parameter. The server should
     * use the string-type since it initially only knows socket ID's.
     */
    export type CtorArgs<
        G extends Game.Type,
        S extends Coord.System.GridCapable,
    > = Readonly<{
        gameType: G;
        coordSys: S;

        gridDimensions: Grid.Dimensions<S>;
        languageName: typeof Lang.Modules.NAMES[number];
        langBalancingScheme: BalancingScheme;

        /**
         * The index in `playerDescs` of the operator's ctor args.
         */
        operatorIndex: G extends Game.Type.SERVER ? undefined : number;
        playerDescs: Player.Bundle<Player.CtorArgs<Player.Id>>;
    }>;

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
