import { Lang } from "lang/Lang";
import { BalancingScheme } from "lang/LangSeqTreeNode";

import { Coord, Tile } from "floor/Tile";
import { Grid } from "floor/Grid";

import { Player } from "../player/Player";
import type { PuppetPlayer } from "../player/PuppetPlayer";
import type { OperatorPlayer } from "../player/OperatorPlayer";
import type { ArtificialPlayer } from "../player/ArtificialPlayer";

import { English } from "lang/impl/English";

import { Game } from "../Game";


/**
 * Foundational parts of a Game that are not related to event handling.
 */
export abstract class GameBase<G extends Game.Type, S extends Coord.System> {

    public readonly gameType: G;

    public readonly lang: Lang;

    /**
     * NOTE: Shuffling operations and the
     * {@link Lang} implementation are able to support mid-game changes
     * to the balancing behaviour. Making it fixed for the lifetime of
     * a `Game` is a choice I made in order to make the user experience
     * more simple. It's one less thing they'll see in the in-game UI,
     * and I don't think they'd feel as if it were missing.
     */
    protected readonly langBalancingScheme: BalancingScheme;

    public readonly grid: Grid<S>;

    protected readonly players: Player.Bundle<Player<S>>;

    public readonly operator: G extends Game.Type.SERVER ? undefined : OperatorPlayer<S>;

    public readonly averageHealthOnFloor: Player.Health.Raw;
    private currentHealthOnFloor: Player.Health.Raw; // TODO.impl maintain this field. and use it to spawn in health.

    /**
     * Indexable by team ID's.
     */
    public readonly teams: ReadonlyArray<Player.Team<S>>;

    #status: Game.Status;


    /**
     * _Does not call reset._
     *
     * Performs the "no invincible player" check (See {@link Player#teamSet}).
     *
     * @param gameType -
     * @param tileClass -
     * @param desc -
     */
    public constructor(
        gameType: G,
        tileClass: Tile.ClassIf<S>,
        desc: Game.CtorArgs<G,S>,
    ) {
        this.gameType = gameType;
        this.grid = new (this.__getGridImplementation(desc.coordSys))({
            tileClass:  tileClass,
            coordSys:   desc.coordSys,
            dimensions: desc.gridDimensions,
        });
        this.averageHealthOnFloor = desc.averageRawHealthOnFloorPerTile * this.grid.area;

        // TODO.design How to get a Language implementation by name?
        // Below is a placeholder waiting for the above todo item to be sorted out.
        this.lang = English.Lowercase.getInstance();

        // TODO.impl Enforce this in the UI code by greying out unusable combos of lang and coord-sys.
        const minLangLeaves = this.grid.static.getAmbiguityThreshold();
        if (this.lang.numLeaves < minLangLeaves) {
            throw new Error(`Found ${this.lang.numLeaves} leaves, but at`
            + ` least ${minLangLeaves} were required. The provided mappings`
            + ` composing the current Lang-under-construction are not`
            + ` sufficient to ensure that a shuffling operation will always`
            + ` be able to find a safe candidate to use as a replacement.`
            + ` Please see the spec for ${Lang.prototype.getNonConflictingChar.name}.`
            );
        }
        this.langBalancingScheme = desc.langBalancingScheme;

        // Construct players:
        this.players = this.createPlayers(desc);
        if (desc.operatorIndex) {
            (this.operator as OperatorPlayer<S>) = this.players.get({
                family: Player.Family.HUMAN,
                number: desc.operatorIndex!,
            }) as OperatorPlayer<S>;
        }
        const teams: Array<Array<Player<S>>> = [];
        (this.players.values.flat() as ReadonlyArray<Player<S>>).forEach((player) => {
            if (!teams[player.teamId]) {
                teams[player.teamId] = [];
            }
            teams[player.teamId].push(player);
        });
        this.teams = teams.map((teammateArray, teamId) => {
            return new Player.Team<S>(teamId, teammateArray);
        });
    }

    /**
     * Reset the grid and the language hit-counters, performs language
     * sequence shuffle-ins, re-spawns players, and spawns in targets.
     */
    public reset(): void {
        this.grid.reset();
        this.currentHealthOnFloor = 0.0;

        // Reset hit-counters in the current language:
        // This must be done before shuffling so that the previous
        // history of shuffle-ins has no effects on the new pairs.
        this.lang.reset();

        // Shuffle everything:
        this.grid.forEachTile(this.shuffleLangCharSeqAt, this);

        // Reset and spawn players:
        this.teams.forEach((team) => team.reset());
        const spawnPoints = this.grid.static.getSpawnCoords(
            this.players.counts,
            this.grid.dimensions,
        );
        this.players.values.forEach((familyMembers) => {
            familyMembers.forEach((player) => {
                player.reset(this.grid.tile.at(spawnPoints.get(player.playerId)));
            });
        });

        // TODO.impl Targets should be spawned _after_ players have
        // spawned so they do not spawn in the same tile as any players.
    }

    protected abstract __getGridImplementation(coordSys: S): Grid.ClassIf<S>;


    /**
     * Private helper for the constructor to create player objects.
     * This is bypassed in non-game-manager implementations (Ie. In
     * ClientGame).
     *
     * @param gameDesc -
     * @returns A bundle of the constructed players.
     */
    private createPlayers(gameDesc: Readonly<Game.CtorArgs<G,S>>): Game<G,S>["players"] {
        const playerDescs: Player.Bundle<Player.CtorArgs>
            = (this.gameType === Game.Type.CLIENT)
            ? new Player.Bundle(gameDesc.playerDescs as Game.CtorArgs<Game.Type.CLIENT,S>["playerDescs"])
            : Player.CtorArgs.finalizePlayerIds(new Player.Bundle(gameDesc.playerDescs))
            ;
        return new Player.Bundle(playerDescs.keys.reduce
        <Player.Bundle.Contents<Player<S>>>((build, family) => {
            // Transform the bundle of player constructor-argument descriptors
            // into a bundle of corresponding, newly constructed player objects:
            (build[family] as ReadonlyArray<Player<S>>)
            = playerDescs.contents[family]
            .map((ctorArgs, numberInFamily) => {
                if (family === Player.Family.HUMAN) {
                    return (numberInFamily === gameDesc.operatorIndex)
                        ? this.__createOperatorPlayer(ctorArgs)
                        : this.__createHumanPlayer(ctorArgs);
                } else {
                    return this.__createArtifPlayer(ctorArgs);
                }
            });
            return build;
        }, {} as Player.Bundle.Contents<Player<S>>));
    }

    protected abstract __createOperatorPlayer(desc: Player.CtorArgs): OperatorPlayer<S>;
    protected abstract __createHumanPlayer(desc: Player.CtorArgs): PuppetPlayer<S>;
    protected abstract __createArtifPlayer(desc: Player.CtorArgs):
    (G extends Game.Type.Manager ? ArtificialPlayer<S> : PuppetPlayer<S>);

    public get status(): Game.Status {
        return this.#status;
    }
    public statusBecomePlaying(): void {
        if (this.status !== Game.Status.PAUSED) {
            throw new Error("Can only resume a game that is currently paused.");
        }
        this.__abstractStatusBecomePlaying();
        this.#status = Game.Status.PLAYING;
    }
    public statusBecomePaused(): void {
        if (this.status !== Game.Status.PLAYING) {
            throw new Error("Can only pause a game that is currently playing.");
        }
        this.__abstractStatusBecomePaused();
        this.#status = Game.Status.PAUSED;
    }
    public statusBecomeOver(): void {
        if (this.status !== Game.Status.PLAYING) {
            throw new Error("Can only end a game that is currently playing.");
        }
        this.__abstractStatusBecomeOver();
        this.#status = Game.Status.OVER;
    }
    // TODO.impl
    protected __abstractStatusBecomePlaying(): void {}
    protected __abstractStatusBecomePaused(): void {}
    protected __abstractStatusBecomeOver(): void {}


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
    public shuffleLangCharSeqAt(targetTile: Tile<S>): Lang.CharSeqPair {
        // First, clear values for the target tile so its current
        // (to-be-previous) values don't get unnecessarily avoided.
        targetTile.setLangCharSeq(Lang.CharSeqPair.NULL);

        const avoid: ReadonlyArray<Tile<S>> = Array.from(new Set(
            this.grid.tile.sourcesTo((targetTile as Tile<S>).coord).get
            .flatMap((sourceToTarget) => this.grid.tile.destsFrom(sourceToTarget.coord).get)
        ));
        return this.lang.getNonConflictingChar(avoid
                .map((tile) => tile.langSeq)
                .filter((seq) => seq), // no falsy values.
            this.langBalancingScheme,
        );
    }


    public abstract setTimeout(callback: Function, millis: number, ...args: any[])
    : G extends Game.Type.SERVER ? NodeJS.Timeout : number;

    public abstract cancelTimeout(handle: number | NodeJS.Timeout): void;

}
