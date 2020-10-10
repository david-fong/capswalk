import type { Lang } from "lang/Lang";

import type { Coord, Tile } from "floor/Tile";
import type { Grid } from "floor/Grid";
import type { Player, PlayerStatus } from "./player/Player";


/**
 * **Important** To be properly disposed of, a game must first have
 * either naturally ended, or be paused- both operations of which will
 * properly cancel all internal scheduled callbacks (the callbacks
 * refer to players, which refer to their game, which refers to a
 * whole lot of other things such as the language dictionary, which
 * in some cases may be quite large.)
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
        export type Browser = Type.OFFLINE | Type.ONLINE;
    }

    /**
     * Unlike CtorArgs, these are not passed as no-prototype objects
     * (possibly over the network) from the game manager to clients.
     * These are abstract handles to game-implementation-dependant
     * components.
     */
    export type ImplArgs<
        G extends Game.Type,
        S extends Coord.System,
    > = {
        onGameBecomeOver: () => void,
        tileClass: Tile.ClassIf<S>,
        playerStatusCtor: typeof PlayerStatus,
    };

    /**
     * ## Game Constructor Arguments
     *
     * **IMPORTANT**: Upon modification, make appropriate changes to
     * GamepartManager's function for verifying validity of client
     * input on the server side.
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
        averageFreeHealthPerTile: Player.Health;

        langId: Lang.FrontendDesc["id"];
        langWeightExaggeration: Lang.WeightExaggeration;

        playerDescs: G extends Game.Type.Manager
            ? TU.RoArr<Player.CtorArgs.PreIdAssignment>
            : TU.RoArr<Player.CtorArgs>
        ;
    }>;
    export namespace CtorArgs {

        export namespace Event {
            export const NAME = "game-create";
            /**
             * This is used as the payload with the above event name when
             * notifying the server's joiner namespace that the group is
             * returning to their lobby from playing a game.
             */
            export const RETURN_TO_LOBBY_INDICATOR = "return-to-lobby";
        }
        export const EVENT_NAME_CLIENT_READY_RESET     = "client-ready-for-reset";
        export const EVENT_NAME_CLIENT_READY_UNPAUSE   = "client-ready-for-unpause";
        export const EVENT_NAME_SERVER_APPROVE_UNPAUSE = "server-approve-unpause";
        export const EVENT_NAME_SERVER_APPROVE_PAUSE   = "server-approve-pause";

        /**
         */
        export type FailureReasons = {
            missingFields: Array<keyof CtorArgs<Game.Type, Coord.System>>;
        };

        // export type _GameTypeDependantPart<G_group extends Game.Type, S extends Coord.System>
        // = any extends G_group ? any : {[G in G_group]:
        //     G extends Game.Type.Manager ? {
        //         playerDescs: TU.RoArr<Player.CtorArgs.PreIdAssignment>;
        //     } : {
        //         playerDescs: TU.RoArr<Player.CtorArgs>;
        //     }
        // }[G_group];
    }

    /**
     * Serialization of the Game State after a reset.
     *
     * Only contains state information that would not be known by a
     * non-Game Manager.
     */
    export type ResetSer<S extends Coord.System> = Readonly<{
        csps: TU.RoArr<Lang.CharSeqPair>;
        playerCoords: TU.RoArr<Coord.Bare[S]>;
        healthCoords: TU.RoArr<{
            coord: Coord.Bare[S];
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
         * re-spawned after being consumed.
         */
        HEALTH_UPDATE_CHANCE: 0.1,
        /**
         * A value in `(0,1]`. If `1`, then players can (on average),
         * boost indefinitely. If close to zero, then players virtually
         * cannot boost, no matter how much health they have. If `0.3`,
         * players can boost for roughly 30% of the movements they make.
         *
         * This value assumes that the player moves around aimlessly
         * and randomly. Adjustments for more rational assumptions are
         * not to be made _here_.
         */
        PCT_MOVES_THAT_ARE_BOOST: 0.05,
        /**
         * A value in `(0,1]` (values greater than one are legal from
         * a mathematical standpoint, but not from one of game-design).
         * Scales the health received from picking up free health for
         * a player who is downed.
         *
         * This value exists to dampen the ability for team members to
         * regenerate health when downed so that it takes a (subjectively)
         * "reasonable" amount of effort to eliminate an entire team-
         * not too much, not too little.
         */
        HEALTH_EFFECT_FOR_DOWNED_PLAYER: 0.6,
        /**
         * A strictly-positive integer.
         *
         * This describes a functionality put in place to limit memory
         * consumption for keeping track of events affected by network
         * latency. See `EVENT_RECORD_FORWARD_WINDOW_LENGTH` for more
         * explanation.
         */
        EVENT_RECORD_WRAPPING_BUFFER_LENGTH: 128,
        /**
         *
         */
        EVENT_RECORD_FORWARD_WINDOW_LENGTH: 64,
    });
}
Object.freeze(Game);
