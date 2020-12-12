import type { Lang } from "defs/TypeDefs";

import type { Coord } from "floor/Tile";
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
 * all be exposed through a pre-game page.
 *
 * There are overlaps between what each implementation needs to do:
 * - Offline and Server games maintain and control the master-game-state.
 * - Offline and Client games display the game-state to an operator via browser and HTML.
 * - Client  and Server games use network operations to communicate.
 */
export namespace Game {

	export enum Type {
		SERVER  = "SERVER",
		ONLINE  = "ONLINE",
		OFFLINE = "OFFLINE",
	}
	export namespace Type {
		export type Manager = Type.OFFLINE | Type.SERVER;
		export type Browser = Type.OFFLINE | Type.ONLINE;
	}
	Object.freeze(Type);

	/**
	 * Unlike CtorArgs, these are not passed as no-prototype objects
	 * (possibly over the network) from the game manager to clients.
	 * These are abstract handles to game-implementation-dependant
	 * components.
	 */
	export type ImplArgs = {
		onGameBecomeOver: () => void,
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
		gridDimensions: Grid.Dimensions[S];
		averageFreeHealthPerTile: Player.Health;

		langId: Lang.FrontendDesc["id"];
		langWeightExaggeration: Lang.WeightExaggeration;

		playerDescs: G extends Game.Type.Manager
			? TU.RoArr<Player.CtorArgs.PreIdAssignment>
			: TU.RoArr<Player.CtorArgs>
		;
	}>;
	export namespace CtorArgs {
		/**
		 */
		export type FailureReasons = {
			missingFields: Array<keyof CtorArgs<Game.Type, Coord.System>>;
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
		playerCoords: TU.RoArr<Coord>;
		healthCoords: TU.RoArr<{
			coord: Coord;
			health: Player.Health;
		}>;
	}>;

	/**
	 * - **`PLAYING`** can go to:
	 *   - `PAUSED`: when a pause request initiated by a player is accepted.
	 *   - `OVER`:  when certain conditions of players being downed are met.
	 * - **`PAUSED`** can go to:
	 *   - `PLAYING`: similar to PLAYING->PAUSED.
	 * - **`OVER`** can go to:
	 *   - `PLAYING`: via resetting the game.
	 */
	export enum Status {
		PLAYING = "PLAYING",
		PAUSED  = "PAUSED",
		OVER    = "OVER",
	}
	Object.freeze(Status);

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
		 * Affects the distribution of health across the grid: "How
		 * concentrated or how diluted the average amount of health on
		 * the grid will be". Higher values cause concentration; lower
		 * values result in dilution.
		 */
		AVERAGE_HEALTH_TO_SPAWN_ON_TILE: 1.0,

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
		PORTION_OF_MOVES_THAT_ARE_BOOST: 0.4,

		/**
		 * Takes into consideration all contributing factors to determine
		 * how much health it should cost to perform a single boost.
		 *
		 * It calculates for the following behaviour: Assuming that a
		 * player is only trying to collect health and always takes the
		 * optimal route, how much health should it cost them to boost
		 * such that they can only only boost for a determined percentage
		 * of all their movement actions?
		 */
		HEALTH_COST_OF_BOOST(
			averageHealthPerTile: Player.Health,
			gridGetDiameter: (area: number) => number,
		): Player.Health {
			// First, assume that a player has just landed on a tile
			// with free health, and now plans to take the optimal
			// route to the nearest tile with free health. Assume that
			// Health is distributed uniformly, and spaced evenly apart.
			// Then the grid/floor can be nicely divided into similar
			// patches each with one tile with free health in the center.
			// Find the diameter of a patch:
			const patchArea = this.AVERAGE_HEALTH_TO_SPAWN_ON_TILE / averageHealthPerTile;
			const patchDiameter = gridGetDiameter(patchArea);

			// The patch diameter is the average optimal distance to
			// the nearest tile with health (the center of the nearest
			// patch). We know how much health awaits there, so we can
			// find the average rate of health gain per movement on an
			// optimal health-seeking path.
			const healthGainedPerOptimalMove
				= this.AVERAGE_HEALTH_TO_SPAWN_ON_TILE / patchDiameter;

			// Since the portion of moves that can be boosts equals
			// the rate of health gain divided by the health cost of
			// boosting, (rearrange terms to solve):
			return healthGainedPerOptimalMove / this.PORTION_OF_MOVES_THAT_ARE_BOOST;
		},

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
		EVENT_RECORD_WRAPPING_BUFFER_LENGTH: 50,

		/**
		 * Must be less than `EVENT_RECORD_WRAPPING_BUFFER_LENGTH`.
		 */
		EVENT_RECORD_FORWARD_WINDOW_LENGTH: 25,
	});

	if (DEF.DevAssert && K.EVENT_RECORD_FORWARD_WINDOW_LENGTH >= K.EVENT_RECORD_WRAPPING_BUFFER_LENGTH) {
		throw new Error("never");
	}
}
Object.freeze(Game);