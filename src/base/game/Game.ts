import type { Lang } from "lang/Lang";
import type { BalancingScheme } from "lang/LangSeqTreeNode";

import type { Coord } from "floor/Tile";
import type { Grid } from "floor/Grid";

import type { Player } from "./player/Player";

import { GameEvents } from "./__gameparts/Events";
import { PuppetPlayer } from "game/player/PuppetPlayer";


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
export abstract class Game<G extends Game.Type, S extends Coord.System> extends GameEvents<G,S> {

    /**
     * @override
     */
    protected __createHumanPlayer(desc: Player.CtorArgs): PuppetPlayer<S> {
        return new PuppetPlayer(this, desc);
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
     */
    export type CtorArgs<
        G extends Game.Type,
        S extends Coord.System,
    > = Readonly<{
        coordSys: S;
        gridDimensions: Grid.Dimensions<S>;

        languageName: typeof Lang.Modules.NAMES[number];
        langBalancingScheme: BalancingScheme;

        /**
         * The index in `playerDescs` of the operator's ctor args.
         */
        operatorIndex: G extends Game.Type.SERVER
            ? undefined
            : Player.Id["number"];
        playerDescs: Player.Bundle.Contents<(
            G extends Game.Type.Manager
            ? Player.CtorArgs.PreIdAssignment
            : Player.CtorArgs
        )>;

        averageRawHealthOnFloor: Player.Health.Raw;
    }>;

    export namespace CtorArgs {

        export const EVENT_NAME = "game-create";

        /**
         * Not used here, but used in {@link GroupSession#createGameInstance}.
         */
        export type FailureReasons = {
            undefinedUsername: ReadonlyArray<Player.SocketId>; // socket ID's
            undefinedTeamId:   ReadonlyArray<Player.SocketId>;
        };
    }

    /**
     * - **`PLAYING`** can go to:
     *   - `PAUSED`: when a pause request initiated by a player is accepted.
     *   - `OVER`:  when certain conditions of players being downed are met.
     * - **`PAUSED`** can go to:
     *   - `PLAYING`: similar to PLAYING->PAUSED.
     * - **`OVER`** can go to:
     *   - `PLAYING`: via resetting the game.
     */
    export const enum Status {
        PLAYING = "PLAYING",
        PAUSED  = "PAUSED",
        OVER    = "OVER",
    }

}
