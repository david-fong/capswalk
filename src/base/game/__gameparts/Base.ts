import { Lang } from "lang/Lang";
import { BalancingScheme } from "lang/LangSeqTreeNode";

import { Coord, Tile } from "floor/Tile";
import { Grid } from "floor/Grid";

import { Player } from "../player/Player";
import { PuppetPlayer } from "../player/PuppetPlayer";
import { OperatorPlayer } from "../player/OperatorPlayer";
import { ArtificialPlayer } from "../player/ArtificialPlayer";

import { Game } from "../Game";


/**
 * Foundational parts of a Game that are not related to event handling.
 */
export abstract class GameBase<G extends Game.Type, S extends Coord.System> {

    public readonly gameType: G;

    public readonly tileClass: Tile.ClassIf<S>;

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

    protected readonly __players: Player.Bundle<Player<S>>;

    public readonly operator: G extends Game.Type.SERVER ? undefined : OperatorPlayer<S>;



    /**
     * _Does not call reset._
     * 
     * Performs the "no invincible player" check (See {@link Player#teamSet}).
     * 
     * @param desc -
     * @param tileClass -
     */
    public constructor(desc: Game.CtorArgs<G,S>, tileClass: Tile.ClassIf<S>) {
        this.gameType = desc.gameType;
        this.tileClass = tileClass;
        this.grid = new (Grid.getImplementation(desc.coordSys))({
            coordSys:   desc.coordSys,
            dimensions: desc.gridDimensions,
            tileClass:  this.tileClass,
        });

        // TODO: set default language (must be done before call to reset):
        //this.lang = import(desc.languageName);

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

        // Construct players:
        this.__players = this.createPlayers(desc);
        if (desc.operatorIndex) {
            (this.operator as OperatorPlayer<S>) = this.__players.get({
                operatorClass: Player.Operator.HUMAN,
                intraClassId: desc.operatorIndex!,
            }) as OperatorPlayer<S>;
        }

        // Check to make sure that none of the players are invincible:
        // @see Player#beNiceTo. consider making some static helper method.
        {
            ;
        }
    }

    /**
     * Reset the grid and the language hit-counters, performs language
     * sequence shuffle-ins, respawns players, and spawns in targets.
     */
    public reset(): void {
        this.grid.reset();

        // Reset hit-counters in the current language:
        // This must be done before shuffling so that the previous
        // history of shuffle-ins has no effects on the new pairs.
        this.lang.reset();

        // Shuffle everything:
        this.grid.forEachTile(this.shuffleLangCharSeqAt, this);

        const playerCounts = {} as Record<Player.Operator, number>;
        for (const operatorClass in this.__players) {
            Player.assertIsOperator(operatorClass);
            playerCounts[operatorClass] = this.__players[operatorClass].length;
        }
        const spawnPoints = this.grid.class.getSpawnCoords(playerCounts, this.grid.dimensions);
        this.__players.values.forEach((sameClassPlayers) => {
            sameClassPlayers.forEach((player) => {
                // Reset:
                player.reset(this.grid.tile.at(spawnPoints.get(player.playerId)));
            });
        });

        // TODO: Targets should be done after players have
        // spawned so they do not spawn under players.
    }



    /**
     * Private helper for the constructor.
     * 
     * @param desc -
     * @returns A bundle of the constructed players.
     */
    private createPlayers(desc: Readonly<Game.CtorArgs<G,S>>): Game<G,S>["__players"] {
        if (desc.gameType === Game.Type.CLIENT) {
            throw new TypeError("This must be overriden for an online-client implementation.");
        }
        const players = {} as Player.Bundle.Mutable<Player<S>>;
        desc.playerDescs.keys.forEach((operatorClass) => {
            players[operatorClass] = desc.playerDescs[operatorClass].map((ctorArgs, intraClassId) => {
                if (operatorClass === Player.Operator.HUMAN) {
                    return (intraClassId === desc.operatorIndex)
                        ? this.createOperatorPlayer(ctorArgs)
                        : this.createHumanPlayer(ctorArgs);
                } else {
                    return this.createArtifPlayer(ctorArgs);
                }
            });
        });
        return players as Game<G,S>["__players"];
    }

    protected abstract createOperatorPlayer(desc: Player.CtorArgs): OperatorPlayer<S>;
    protected abstract createHumanPlayer(desc: Player.CtorArgs): PuppetPlayer<S>;
    protected abstract createArtifPlayer(desc: Player.CtorArgs):
    (G extends Game.Type.Manager ? ArtificialPlayer<S> : PuppetPlayer<S>);



    /**
     * **Important:** Nullifies the existing values at `tile` and does
     * not consume the returned values, which must be done externally.
     * 
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



    public abstract setTimeout(callback: Function, millis: number, ...args: any[]): G extends Game.Type.SERVER ? NodeJS.Timeout : number;

    public abstract cancelTimeout(handle: number | NodeJS.Timeout): void;

}