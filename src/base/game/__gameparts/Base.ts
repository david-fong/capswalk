import { Lang } from "lang/Lang";
import { BalancingScheme } from "lang/LangSeqTreeNode";

import { Coord, Tile } from "floor/Tile";
import { Grid } from "floor/Grid";

import { Player } from "../player/Player";
import { PuppetPlayer } from "../player/PuppetPlayer";
import { HumanPlayer } from "../player/HumanPlayer";
import { ArtificialPlayer } from "../player/ArtificialPlayer";

import { Game } from "../Game";


export abstract class GameBase<G extends Game.Type, S extends Coord.System.GridCapable> {

    public readonly gameType: G;

    public readonly tileClass: Tile.ClassIf<S>;

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
    protected readonly __players: Player.Bundle<Player<S>>;

    public readonly operator: G extends Game.Type.SERVER ? undefined : HumanPlayer<S>;



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
        this.grid = Grid.of(desc.coordSys, {
            dimensions: desc.gridDimensions,
            tileClass: this.tileClass,
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
            (this.operator as HumanPlayer<S>) = this.getPlayerById({
                operatorClass: Player.Operator.HUMAN,
                intraClassId: desc.operatorIndex!,
            }) as HumanPlayer<S>;
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

        for (const sameClassPlayers of Object.values(this.__players)) {
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
     * @param desc -
     * @returns A bundle of the constructed players.
     */
    private createPlayers(desc: Readonly<Game.CtorArgs<G,S>>): Game<G,S>["__players"] {
        if (desc.gameType === Game.Type.CLIENT) {
            throw new TypeError("This must be overriden for an online-client implementation.");
        }
        const players: Partial<Record<Player.Operator, ReadonlyArray<Player<S>>>> = {};
        for (const [ operatorClass, playersCtorArgs, ] of Object.entries(desc.playerDescs)) {
            Player.assertIsOperator(operatorClass);
            players[operatorClass] = playersCtorArgs.map((ctorArgs, intraClassId) => {
                if (operatorClass === Player.Operator.HUMAN) {
                    return (intraClassId === desc.operatorIndex)
                        ? this.createOperatorPlayer(ctorArgs)
                        : this.createHumanPlayer(ctorArgs);
                } else {
                    return this.createArtifPlayer(ctorArgs);
                }
            });
        }
        return players as Game<G,S>["__players"];
    }

    protected abstract createOperatorPlayer(desc: Player.CtorArgs): HumanPlayer<S>;
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



    public abstract setTimeout(callback: Function, millis: number, ...args: any[]): G extends Game.Type.SERVER ? NodeJS.Timeout : number;

    public abstract cancelTimeout(handle: number | NodeJS.Timeout): void;

    /**
     * @returns
     * The tile at `dest`, or the specified player's {@link Player#benchTile}.
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
        return this.__players[playerId.operatorClass][playerId.intraClassId];
    }

}