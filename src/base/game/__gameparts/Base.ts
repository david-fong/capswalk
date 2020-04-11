import { Game } from "../Game";
import type { Coord, Tile } from "floor/Tile";
import type { Grid } from "floor/Grid";

import { Player } from "../player/Player";
import { PuppetPlayer } from "../player/PuppetPlayer";
import type { OperatorPlayer } from "../player/OperatorPlayer";
import type { ArtificialPlayer } from "../player/ArtificialPlayer";
import type { PlayerActionEvent } from "game/events/PlayerActionEvent";



/**
 * Foundational parts of a Game that are not related to event handling.
 */
export abstract class GameBase<G extends Game.Type, S extends Coord.System> {

    public readonly gameType: G;

    public readonly grid: Grid<S>;

    protected readonly players: Player.Bundle<Player<S>>;

    public readonly operator: G extends Game.Type.SERVER ? undefined : OperatorPlayer<S>;

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
        const gridClass = this.__getGridImplementation(desc.coordSys);
        this.grid = new (gridClass)({
            tileClass:  tileClass,
            coordSys:   desc.coordSys,
            dimensions: desc.gridDimensions,
        });

        // Construct players:
        this.players = this.createPlayers(desc);
        if (desc.operatorIndex) {
            (this.operator as Player<S>) = this.players.get({
                family: Player.Family.HUMAN,
                number: desc.operatorIndex!,
            });
        }
        const teams: Array<Array<Player<S>>> = [];
        this.players.flat.forEach((player) => {
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
     * Reset the grid.
     */
    public reset(): void {
        this.grid.reset();
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
    private createPlayers(gameDesc: Readonly<Game.CtorArgs<G,S>>): GameBase<G,S>["players"] {
        const playerDescs: Player.Bundle<Player.CtorArgs>
            = (this.gameType === Game.Type.CLIENT)
            ? new Player.Bundle(gameDesc.playerDescs as Game.CtorArgs<Game.Type.CLIENT,S>["playerDescs"])
            : Player.CtorArgs.finalizePlayerIds(new Player.Bundle(gameDesc.playerDescs), gameDesc.languageName)
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
    protected __createHumanPlayer(desc: Player.CtorArgs): PuppetPlayer<S> {
        return new PuppetPlayer(this, desc);
    }
    protected abstract __createArtifPlayer(desc: Player.CtorArgs):
    (G extends Game.Type.Manager ? ArtificialPlayer<S> : PuppetPlayer<S>);

    public get status(): Game.Status {
        return this.#status;
    }
    public statusBecomePlaying(): void {
        if (this.status !== Game.Status.PAUSED) {
            throw new Error("Can only resume a game that is currently paused.");
        }
        this.players.flat.forEach((player) => {
            player.__abstractNotifyThatGameStatusBecamePlaying();
        })
        this.__abstractStatusBecomePlaying();
        this.#status = Game.Status.PLAYING;
    }
    public statusBecomePaused(): void {
        if (this.status !== Game.Status.PLAYING) {
            throw new Error("Can only pause a game that is currently playing.");
        }
        this.players.flat.forEach((player) => {
            player.__abstractNotifyThatGameStatusBecamePaused();
        })
        this.__abstractStatusBecomePaused();
        this.#status = Game.Status.PAUSED;
    }
    public statusBecomeOver(): void {
        if (this.status !== Game.Status.PLAYING) {
            throw new Error("Can only end a game that is currently playing.");
        }
        this.players.flat.forEach((player) => {
            player.__abstractNotifyThatGameStatusBecameOver();
        })
        this.__abstractStatusBecomeOver();
        this.#status = Game.Status.OVER;
    }
    // TODO.impl
    protected __abstractStatusBecomePlaying(): void {}
    protected __abstractStatusBecomePaused(): void {}
    protected __abstractStatusBecomeOver(): void {}


    public abstract setTimeout(callback: Function, millis: number, ...args: any[])
    : G extends Game.Type.SERVER ? NodeJS.Timeout : number;

    public abstract cancelTimeout(handle: number | NodeJS.Timeout): void;

 /* The implementations are fully defined and publicly exposed by
    GameManager. These protected declarations higher up the class
    hierarchy exist to allow ClientGame to override them to send
    a request to the ServerGame. */
    public abstract processMoveRequest(desc: PlayerActionEvent.Movement<S>): void;
    protected abstract processBubbleRequest(desc: PlayerActionEvent.Bubble): void;

}
