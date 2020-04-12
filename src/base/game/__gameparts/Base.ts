import { Game } from "../Game";
import type { Coord, Tile } from "floor/Tile";
import type { Grid } from "floor/Grid";

import { Player, PlayerStatus } from "../player/Player";
import type { OperatorPlayer } from "../player/OperatorPlayer";
import type { ArtificialPlayer } from "../player/ArtificialPlayer";
import type { PlayerActionEvent } from "game/events/PlayerActionEvent";



/**
 * Foundational parts of a Game that are not related to event handling.
 */
export abstract class GameBase<G extends Game.Type, S extends Coord.System> {

    public readonly gameType: G;

    public readonly grid: Grid<S>;

    protected readonly players: ReadonlyArray<Player<S>>;

    public readonly operator: G extends Game.Type.SERVER ? undefined : OperatorPlayer<S>;

    /**
     * Indexable by team ID's.
     */
    public readonly teams: ReadonlyArray<Player.Team<S>>;

    #status: Game.Status;

    public readonly __playerStatusCtor: typeof PlayerStatus;


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
        impl: Game.ImplArgs<S>,
        desc: Game.CtorArgs<G,S>,
    ) {
        this.gameType = gameType;
        const gridClass = this.__getGridImplementation(desc.coordSys);
        this.grid = new (gridClass)({
            gridClass:  gridClass,
            tileClass:  impl.tileClass,
            coordSys:   desc.coordSys,
            dimensions: desc.gridDimensions,
            domGridHtmlIdHook: (desc.gridHtmlIdHook || "n/a")!,
        });

        // Construct players:
        this.__playerStatusCtor = impl.playerStatusCtor;
        this.players = this.createPlayers(desc);
        if (desc.operatorIndex !== undefined) {
            // Note at above comparison: we must be explicit
            // since zero is a valid, _falsy_ operatorIndex.
            (this.operator as Player<S>) = this.players[desc.operatorIndex!];
        }
        const teams: Array<Array<Player<S>>> = [];
        this.players.forEach((player) => {
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
        const playerDescs: ReadonlyArray<Player.CtorArgs>
            = (this.gameType === Game.Type.CLIENT)
            // The client receives these descriptors already finalized / cleaned by the server.
            ? gameDesc.playerDescs as Game.CtorArgs<Game.Type.CLIENT,S>["playerDescs"]
            : Player.CtorArgs.finalize(gameDesc.playerDescs, gameDesc.languageName)
            ;
        return playerDescs.map((playerDesc, playerIndex) => {
            if (playerDesc.familyId === Player.Family.HUMAN) {
                return (playerIndex === gameDesc.operatorIndex)
                    ? this.__createOperatorPlayer(playerDesc)
                    : new Player(this, playerDesc);
            } else {
                return this.__createArtifPlayer(playerDesc);
            }
        });
    }
    protected abstract __createOperatorPlayer(desc: Player.CtorArgs): OperatorPlayer<S>;
    protected abstract __createArtifPlayer(desc: Player.CtorArgs):
    (G extends Game.Type.Manager ? ArtificialPlayer<S> : Player<S>);

    public get status(): Game.Status {
        return this.#status;
    }
    public statusBecomePlaying(): void {
        if (this.status !== Game.Status.PAUSED) {
            throw new Error("Can only resume a game that is currently paused.");
        }
        this.players.forEach((player) => {
            player.__abstractNotifyThatGameStatusBecamePlaying();
        })
        this.__abstractStatusBecomePlaying();
        this.#status = Game.Status.PLAYING;
    }
    public statusBecomePaused(): void {
        if (this.status !== Game.Status.PLAYING) {
            throw new Error("Can only pause a game that is currently playing.");
        }
        this.players.forEach((player) => {
            player.__abstractNotifyThatGameStatusBecamePaused();
        })
        this.__abstractStatusBecomePaused();
        this.#status = Game.Status.PAUSED;
    }
    public statusBecomeOver(): void {
        if (this.status !== Game.Status.PLAYING) {
            throw new Error("Can only end a game that is currently playing.");
        }
        this.players.forEach((player) => {
            player.__abstractNotifyThatGameStatusBecameOver();
        })
        this.__abstractStatusBecomeOver();
        this.#status = Game.Status.OVER;
    }
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
Object.freeze(GameBase.prototype);
