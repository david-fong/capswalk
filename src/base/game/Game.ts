import type { Lang } from "lang/Lang";

import type { Coord, Tile } from "floor/Tile";
import type { Grid } from "floor/Grid";
import type { Player, PlayerStatus } from "./player/Player";


/**
 *
 *
 * These classes perform the majority of management over {@link Tile}
 * and {@link Player} objects. As a design choice, players can only join
 * a game before it starts, and actions such as changing the language or
 * difficulty require a restart. These actions that require a restart will
 * all be exposed to operators through a pre-game page. Other such actions
 * include: changing teams.
 *
 * There are overlaps between what each implementation needs to do:
 * - Offline and Server games maintain and control the master-game-state.
 * - Offline and Client games display the game-state to an operator via browser and HTML.
 * - Client  and Server games use network operations to communicate.
 */
export namespace Game {

    export const enum Type {
        SERVER  = "SERVER",
        ONLINE  = "ONLINE",
        OFFLINE = "OFFLINE",
    }
    export namespace Type {
        export type Manager = Type.OFFLINE | Type.SERVER;
    }

    /**
     * Unlike CtorArgs, these are not passed as no-prototype objects
     * (possibly over the network) from the game manager to clients.
     * These are abstract handles to game-implementation-dependant
     * components.
     */
    export type ImplArgs<S extends Coord.System> = {
        tileClass: Tile.ClassIf<S>,
        playerStatusCtor: typeof PlayerStatus,
    };

    /**
     * # Game Constructor Arguments
     *
     * @template S
     * The coordinate system to use. The literal value must also be
     * passed as the field `coordSys`.
     */
    export type CtorArgs<
        G extends Game.Type,
        S extends Coord.System,
    > = Readonly<{
        coordSys: S;
        gridDimensions: Grid.Dimensions<S>;
        gridHtmlIdHook: G extends Game.Type.SERVER ? undefined : string;

        languageName: Lang.Names.Value["id"];
        langBalancingScheme: Lang.BalancingScheme;

        /**
         * The index in `playerDescs` of the operator's ctor args.
         */
        operatorIndex: G extends Game.Type.SERVER
            ? undefined
            : Player.Id;
        playerDescs: TU.RoArr<(
            G extends Game.Type.Manager
            ? Player.CtorArgs.PreIdAssignment
            : Player.CtorArgs
        )>;

        averageFreeHealthPerTile: Player.Health;
    }>;

    export namespace CtorArgs {

        export const EVENT_NAME = "game-create";

        /**
         * Not used here, but used in {@link GroupSession#createGameInstance}.
         */
        export type FailureReasons = {
            undefinedUsername: TU.RoArr<Player.SocketId>; // socket ID's
            undefinedTeamId:   TU.RoArr<Player.SocketId>;
        };
    }

    /**
     * Serialization of the Game State after a reset.
     *
     * Only contains state information that would not be known by a
     * non-Game Manager.
     */
    export type ResetSer<S extends Coord.System> = Readonly<{
        csps: TU.RoArr<Lang.CharSeqPair>;
        playerCoords: TU.RoArr<Coord.Bare<S>>;
        healthCoords: TU.RoArr<{
            coord: Coord.Bare<S>;
            health: Player.Health;
        }>;
    }>;
    export namespace Serialization {
        export const EVENT_NAME = <const>"game-reset";
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

    /**
     * Global, Game-Setup-Agnostic constants for tuning game behaviour.
     */
    export const K = Object.freeze(<const>{
        /**
         * A value in `(0,1]`. If `1`, then new health will be spawned
         * the next time `dryRunSpawnFreeHealth` is called. This is the
         * reciprocal of the average number of calls that must be to
         * `dryRunSpawnFreeHealth` before a unit of health will be
         * respawned after being consumed.
         */
        HEALTH_UPDATE_CHANCE: 0.1,
        /**
         * A value in `(0,1]`. If `1`, then players can (on average),
         * boost indefinitely. If close to zero, then players virtually
         * cannot boost, no matter how much health they have. If `0.3`,
         * players can boost for roughly 30% of the movements they make.
         */
        PCT_MOVES_THAT_ARE_BOOST: 0.05,
    });
}
Object.freeze(Game);
