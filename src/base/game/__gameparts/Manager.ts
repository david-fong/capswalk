import { Lang } from "lang/Lang";
import { Game } from "game/Game";

import type { Coord, Tile } from "floor/Tile";
import type { Player } from "../player/Player";

import { PlayerGeneratedRequest } from "../events/EventRecordEntry";
import { PlayerActionEvent, TileModEvent } from "../events/PlayerActionEvent";

import { English } from "lang/impl/English"; // NOTE: temporary placeholder.
import { GameEvents } from "game/__gameparts/Events";


/**
 *
 */
export abstract class GameManager<G extends Game.Type, S extends Coord.System> extends GameEvents<G,S> {

    public readonly averageFreeHealth: Player.Health;
    public readonly averageFreeHealthPerTile: Player.Health;
    #currentFreeHealth: Player.Health;

    public readonly lang: Lang;

    /**
     * NOTE: Shuffling operations and the
     * {@link Lang} implementation are able to support mid-game changes
     * to the balancing behaviour. Making it fixed for the lifetime of
     * a `Game` is a choice I made in order to make the user experience
     * more simple. It's one less thing they'll see in the in-game UI,
     * and I don't think they'd feel as if it were missing.
     */
    protected readonly langBalancingScheme: Lang.BalancingScheme;

    /**
     * _Does not call reset._
     *
     * Performs the "no invincible player" check (See {@link Player#teamSet}).
     *
     * @param gameType -
     * @param impl -
     * @param desc -
     */
    public constructor(
        gameType: G,
        impl: Game.ImplArgs<S>,
        desc: Game.CtorArgs<G,S>,
    ) {
        super(gameType, impl, desc);
        this.averageFreeHealth = desc.averageFreeHealthPerTile * this.grid.area;
        this.averageFreeHealthPerTile = desc.averageFreeHealthPerTile;

        // TODO.impl Change this to use a dynamic import for a Lang registry dict.
        // We need to make that registry dict first!
        this.lang = English.Lowercase.getInstance();

        // TODO.impl Enforce this in the UI code by greying out unusable combos of lang and coord-sys.
        const minLangLeaves = this.grid.static.getAmbiguityThreshold();
        if (this.lang.numLeaves < minLangLeaves) {
            throw new Error(`Found ${this.lang.numLeaves} leaves, but at`
            + ` least ${minLangLeaves} were required. The provided mappings`
            + ` composing the current Lang-under-construction are not`
            + ` sufficient to ensure that a shuffling operation will always`
            + ` be able to find a safe candidate to use as a replacement.`
            + ` Please see the spec for Lang.getNonConflictingChar.`
            );
        }
        this.langBalancingScheme = desc.langBalancingScheme;
    }

    /**
     *
     */
    public reset(): void {
        // Reset the grid and event record:
        super.reset();

        this.#currentFreeHealth = 0.0;

        // Reset hit-counters in the current language:
        // This must be done before shuffling so that the previous
        // history of shuffle-ins has no effects on the new pairs.
        this.lang.reset();
        // Shuffle everything:
        this.grid.forEachTile((tile) => {
            tile.setLangCharSeqPair(this.dryRunShuffleLangCharSeqAt(tile));
        });

        // Reset and spawn players:
        this.teams.forEach((team) => team.reset());
        const spawnPoints = this.grid.static.getSpawnCoords(
            this.players.length,
            this.grid.dimensions,
        );
        this.players.forEach((player) => {
            player.reset(this.grid.tile.at(spawnPoints[player.playerId]));
        });

        // Targets should be spawned _after_ players have spawned so
        // that they do not spawn in the same tile as any players.
        this.dryRunSpawnFreeHealth([])?.forEach((tileModDesc) => {
            this.executeTileModEvent(tileModDesc);
        })
    }


    /**
     * **Important:** Nullifies the existing values at `tile` and does
     * not consume the returned values, which must be done externally.
     *
     * @param targetTile
     * The {@link Tile} to shuffle their {@link Lang.CharSeqPair}
     * pair for.
     *
     * @returns
     * A {@link Lang.CharSeqPair} that can be used as a replacement
     * for that currently being used by `tile`.
     */
    public dryRunShuffleLangCharSeqAt(targetTile: Tile<S>): Lang.CharSeqPair {
        // First, clear values for the target tile so its current
        // (to-be-previous) values don't get unnecessarily avoided.
        targetTile.setLangCharSeqPair(Lang.CharSeqPair.NULL);

        const avoid: TU.RoArr<Tile<S>> = Array.from(new Set(
            this.grid.tile.sourcesTo(targetTile.coord).get
            .flatMap((sourceToTarget) => this.grid.tile.destsFrom(sourceToTarget.coord).get)
        ));
        return this.lang.getNonConflictingChar(avoid
                .map((tile) => tile.langSeq)
                .filter((seq) => seq), // no falsy values.
            this.langBalancingScheme,
        );
    }

    public get currentFreeHealth(): Player.Health {
        return this.#currentFreeHealth;
    }

    /**
     * @returns
     * A descriptor of changes to make to tiles regarding health spawning.
     *
     * **`IMPORTANT`**: This method does not have any override structure
     * where the Server additionally notifies clients of the changes. It
     * is intended to be wrapped inside other events with such behaviour.
     *
     * Note that this will seem to have a one-movement-event delay in
     * specifying changes to be made because `this.currentFreeHealth`
     * does not update until after the movement request has been
     * executed.
     *
     * @param sameReqOtherModDescs
     * A list of other descs including those specifying modifications
     * to be made in the same `execute???Request` function as the one
     * for which this is being called. Without this information, we
     * could mess up `lastKnownUpdateId` counters at those locations.
     */
    public dryRunSpawnFreeHealth(
        sameReqOtherModDescs: TU.RoArr<TileModEvent<S>>,
    ): TU.RoArr<TileModEvent<S>> | undefined {
        let healthToSpawn = this.averageFreeHealth - this.currentFreeHealth;
        if (healthToSpawn <= 0) return undefined;
        const retval: Array<TileModEvent<S>> = [];
        while (healthToSpawn > 0) {
            let tile: Tile<S>;
            do {
                tile = this.grid.tile.at(this.grid.getRandomCoord());
                // The below equality check is necessary to prevent counting bugs.
                // TODO.learn see other TODO about the type cast seen here on the below line.
            } while ((() => {
                return tile.isOccupied
                || retval.find((desc) => tile.coord.equals(desc.coord as any));
                // TODO.impl add other checks to improve distribution and reduce
                // crowding of freeHealth. Make sure it is sensitive to
                // `this.averageFreeHealthPerTile`.
            })());
            const tileHealthToAdd = 1;
            if ((Math.random() < Game.K.HEALTH_UPDATE_CHANCE)) {
                let otherDesc: TileModEvent<S> | undefined;
                if (otherDesc = sameReqOtherModDescs.find((desc) => tile.coord.equals(desc.coord as any))) {
                    otherDesc.newFreeHealth = (otherDesc.newFreeHealth || 0) + tileHealthToAdd;
                } else {
                    retval.push({
                        coord: tile.coord,
                        lastKnownUpdateId: 1 + tile.lastKnownUpdateId,
                        newCharSeqPair: undefined, // "do not change".
                        newFreeHealth: tile.freeHealth + tileHealthToAdd,
                    })
                }
            }
            healthToSpawn -= tileHealthToAdd;
        }
        return retval;
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
        if (this.status !== Game.Status.PLAYING) {
            return undefined;
        }
        const player = this.players[desc.playerId];
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
     * @see PlayerMovementEvent
     *
     * Reject the request if `dest` is occupied, or if the specified
     * player does not exist, or the client is missing updates for the
     * destination they requested to move to, or the player is bubbling.
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
            // The update ID check is not essential, but it helps
            // enforce stronger client-experience consistency: they cannot
            // move somewhere where they have not realized the `LangSeq` has
            // changed.
            this.processMoveExecute(desc); // Reject the request.
            return;
        }

        // Set response fields according to spec in `PlayerMovementEvent`:
        desc.playerLastAcceptedRequestId = (1 + player.lastAcceptedRequestId);
        desc.newPlayerHealth = {
            score:  player.status.score  + dest.freeHealth,
            health: player.status.health + dest.freeHealth,
        };
        desc.dest.lastKnownUpdateId = (1 + dest.lastKnownUpdateId);
        desc.dest.newFreeHealth     = 0;
        desc.dest.newCharSeqPair    = this.dryRunShuffleLangCharSeqAt(dest);
        desc.tilesWithHealthUpdates = this.dryRunSpawnFreeHealth([desc.dest,]);

        // Accept the request, and trigger calculation
        // and enactment of the requested changes:
        desc.eventId = this.getNextUnusedEventId();
        this.processMoveExecute(desc);
    }

    /**
     * @override
     */
    protected executeTileModEvent(
        desc: TileModEvent<S>,
        doCheckOperatorSeqBuffer: boolean = true,
    ): void {
        const tile = this.grid.tile.at(desc.coord);
        if (desc.lastKnownUpdateId !== (1 + tile.lastKnownUpdateId)) {
            // We literally just specified this in processMoveRequest.
            throw new Error("this never happens. see comment in source.");
        }
        this.#currentFreeHealth += desc.newFreeHealth! - tile.freeHealth;
        super.executeTileModEvent(desc, doCheckOperatorSeqBuffer);
    }


    /**
     * @see PlayerActionEvent.Bubble
     * @param desc - Is modified to describe changes to be made.
     */
    public processBubbleRequest(desc: PlayerActionEvent.Bubble): void {
        // TODO.impl
        // - If successful, make sure to lower the health field.
        // - Make an abstract method in the OperatorPlayer class called in
        //   the top-level input processor for it to trigger this event.
        const bubbler = this.managerCheckGamePlayingRequest(desc);
        if (!bubbler) {
            // Reject the request:
            this.processBubbleExecute(desc);
            return;
        }
        desc.playerLastAcceptedRequestId = (1 + bubbler.lastAcceptedRequestId);

        // We are all go! Do it.
        desc.eventId = this.getNextUnusedEventId();
        this.processBubbleExecute(desc);
    }

}
Object.freeze(GameManager);
Object.freeze(GameManager.prototype);
