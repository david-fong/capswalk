import { Game } from "../Game";
import { Lang } from "defs/TypeDefs";

import type { Coord, Tile } from "floor/Tile";
import type { Grid } from "floor/Grid";
import type { VisibleGrid } from "floor/VisibleGrid";

import { Player, PlayerStatus, Team } from "../player/Player";
import type { OperatorPlayer } from "../player/OperatorPlayer";
import type { ArtificialPlayer } from "../player/ArtificialPlayer";
import type { PlayerActionEvent } from "game/events/PlayerActionEvent";


/**
 * Foundational parts of a Game that are not related to event handling.
 */
export abstract class GameBase<G extends Game.Type, S extends Coord.System> {

    public readonly gameType: G;

    public readonly grid: G extends Game.Type.SERVER ? Grid<S> : VisibleGrid<S>;

    public readonly langFrontend: Lang.FrontendDesc;

    public readonly players: TU.RoArr<Player<S>>;

    // TODO.design a method to rotate the current operator.
    public readonly operators: TU.RoArr<OperatorPlayer<S>>;
    #currentOperator: OperatorPlayer<S> | undefined;

    /**
     * Indexable by team ID's.
     */
    public readonly teams: TU.RoArr<Team<S>>;

    #status: Game.Status;

    public readonly __playerStatusCtor: typeof PlayerStatus;


    /**
     * Performs the "no invincible player" check (See {@link Player#teamSet}).
     *
     * @param gameType -
     * @param impl -
     * @param desc -
     */
    public constructor(
        gameType: G,
        impl: Game.ImplArgs<G,S>,
        desc: Game.CtorArgs<G,S>,
    ) {
        this.gameType = gameType;
        const gridClass = this.__getGridImplementation(desc.coordSys);
        this.grid = new (gridClass)({
            gridClass:  gridClass,
            tileClass:  impl.tileClass,
            coordSys:   desc.coordSys,
            dimensions: desc.gridDimensions,
        }) as GameBase<G,S>["grid"];

        this.langFrontend = Lang.GET_FRONTEND_DESC_BY_ID(desc.langId);

        // Construct players:
        this.__playerStatusCtor = impl.playerStatusCtor;
        this.players = this.createPlayers(desc);

        this.operators = this.players.filter((player) => player.isALocalOperator) as OperatorPlayer<S>[];
        this.#currentOperator = this.operators[0];
        if (this.operators.some((op) => op.teamId !== this.operators[0].teamId)) {
            // Currently requiring this because the current visual colouring
            // is initialized based on whether a player is on the operator's
            // team. Otherwise, we'd have to re-colour when rotating operator.
            throw new Error("All local operators must be on the same team.");
        } {
            const teams: Array<Array<Player<S>>> = [];
            this.players.forEach((player) => {
                if (!teams[player.teamId]) {
                    teams[player.teamId] = [];
                }
                teams[player.teamId].push(player);
            });
            this.teams = teams.map((teammateArray, teamId) => {
                return new Team<S>(teamId, teammateArray);
            });
            if (this.teams.every((team) => team.id === Team.ElimOrder.IMMORTAL)) {
                // TODO.design put a check inside the UI code to prevent this.
                // The purpose of this restriction is to prevent DoS attacks on
                // a hosting server by creating games that can never end and
                // leaving them open forever, thus leaking the server's resources.
                throw new Error("All teams are immortal. The game will never end.");
            }
        }
        this.players.forEach((player) => player.__afterAllPlayersConstruction());
    }

    /**
     * Reset the grid.
     *
     * Overrides should not use the return value. They should return
     * the result of calling `ctorAsync`.
     */
    public async reset(): Promise<void> {
        this.grid.reset();
        // We must reset status to PAUSED to pass a state-transition
        // assertion when changing status later to PLAYING.
        this.#status = Game.Status.PAUSED;

        // Important: Since there is nothing to do in this game-part's
        // ctorAsync getter, we don't need to use `await`.
        return Promise.resolve();
    }

    protected abstract __getGridImplementation(coordSys: S):
    G extends Game.Type.SERVER ? Grid.ClassIf<S> : VisibleGrid.ClassIf<S>;


    /**
     * Private helper for the constructor to create player objects.
     * This is bypassed in non-game-manager implementations (Ie. In
     * OnlineGame).
     *
     * @param gameDesc -
     * @returns A bundle of the constructed players.
     */
    private createPlayers(gameDesc: Readonly<Game.CtorArgs<G,S>>): GameBase<G,S>["players"] {
        type pCtorArgs = TU.RoArr<Player.CtorArgs>;
        const playerDescs: pCtorArgs
            = (gameDesc.playerDescs as pCtorArgs)
            = (this.gameType === Game.Type.ONLINE)
            // The client receives these descriptors already finalized / cleaned by the server.
            ? (gameDesc.playerDescs as pCtorArgs)
            : Player.CtorArgs.finalize(gameDesc.playerDescs);

        return Object.freeze(playerDescs.map((playerDesc) => {
            if (playerDesc.familyId === Player.Family.HUMAN) {
                return (playerDesc.isALocalOperator)
                    ? this.__createOperatorPlayer(playerDesc)
                    : new Player(this, playerDesc);
            } else {
                return this.__createArtifPlayer(playerDesc) as Player<S>;
            }
        }));
    }
    protected abstract __createOperatorPlayer(desc: Player.__CtorArgs<"HUMAN">): OperatorPlayer<S>;
    protected abstract __createArtifPlayer(desc: Player.__CtorArgs<Player.FamilyArtificial>):
    (G extends Game.Type.Manager ? ArtificialPlayer<S> : Player<S>);

    public serializeResetState(): Game.ResetSer<S> {
        const csps: Array<Lang.CharSeqPair> = [];
        const playerCoords = this.players.map((player) => player.coord);
        const healthCoords: TU.NoRo<Game.ResetSer<S>["healthCoords"]> = [];
        this.grid.forEachTile((tile) => {
            csps.push({
                char: tile.langChar,
                seq:  tile.langSeq,
            });
            if (tile.freeHealth) {
                healthCoords.push({
                    coord:  tile.coord,
                    health: tile.freeHealth,
                });
            }
        });
        return { csps, playerCoords, healthCoords, };
    }

    public deserializeResetState(ser: Game.ResetSer<S>): void {
        { let i = 0;
        // Could also use `csps.unshift`, but that may be slower
        // because it modifies csps, which we don't need to do.
        this.grid.forEachTile((tile) => {
            tile.setLangCharSeqPair(ser.csps[i++]);
            tile.lastKnownUpdateId = 1;
        }); }
        ser.playerCoords.forEach((coord, index) => {
            this.players[index].moveTo(this.grid.tile.at(coord));
        });
        ser.healthCoords.forEach((desc) => {
            this.grid.tile.at(desc.coord).freeHealth = desc.health;
        });
    }

    public get currentOperator(): OperatorPlayer<S> | undefined {
        return this.#currentOperator;
    }


    public get status(): Game.Status {
        return this.#status;
    }
    /**
     * On the client side, this should only be accessed through a
     * wrapper function that also makes UI-related changes.
     *
     * If the game is already playing, this does nothing.
     */
    public statusBecomePlaying(): void {
        if (this.status === Game.Status.PLAYING) {
            console.log("Game is already playing");
            return;
        }
        if (this.status !== Game.Status.PAUSED) {
            throw new Error("Can only resume a game that is currently paused.");
        }
        this.players.forEach((player) => {
            player.__abstractNotifyThatGameStatusBecamePlaying();
        });
        this.__abstractStatusBecomePlaying();
        this.#status = Game.Status.PLAYING;
    }
    /**
     * On the client side, this should only be accessed through a
     * wrapper function that also makes UI-related changes.
     *
     * If the game is already paused, this does nothing.
     */
    public statusBecomePaused(): void {
        if (this.status === Game.Status.PAUSED) {
            console.log("Game is already paused");
            return;
        }
        if (this.status !== Game.Status.PLAYING) {
            throw new Error("Can only pause a game that is currently playing.");
        }
        this.players.forEach((player) => {
            player.__abstractNotifyThatGameStatusBecamePaused();
        });
        this.__abstractStatusBecomePaused();
        this.#status = Game.Status.PAUSED;
    }
    /**
     * This should be called when all non-immortal teams have been
     * eliminated. A team is immortal if all its members have the
     * `noCheckGameOver` flag set to `true`. A mortal team becomes
     * (and subsequently, unconditionally stays) eliminated when all
     * their members are in a downed state at the same time.
     *
     * This should not be controllable by UI input elements.
     */
    public statusBecomeOver(): void {
        if (this.status !== Game.Status.PLAYING) {
            throw new Error("Can only end a game that is currently playing.");
        }
        this.players.forEach((player) => {
            player.__abstractNotifyThatGameStatusBecameOver();
        });
        this.__abstractStatusBecomeOver();
        this.#status = Game.Status.OVER;
        console.log("game is over!");
    }
    protected __abstractStatusBecomePlaying(): void {}
    protected __abstractStatusBecomePaused(): void {}
    protected __abstractStatusBecomeOver(): void {}


    public abstract setTimeout(callback: Function, millis: number, ...args: any[])
    : G extends Game.Type.SERVER ? NodeJS.Timeout : number;

    public abstract cancelTimeout(handle: number | NodeJS.Timeout): void;

 /* The implementations are fully defined and publicly exposed by
    GameManager. These protected declarations higher up the class
    hierarchy exist to allow OnlineGame to override them to send
    a request to the ServerGame. */
    public abstract processMoveRequest(desc: PlayerActionEvent.Movement<S>): void;
    protected abstract processBubbleRequest(desc: PlayerActionEvent.Bubble): void;

}
Object.freeze(GameBase);
Object.freeze(GameBase.prototype);
