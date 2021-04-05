import type { Lang } from "lang/Lang";
import type { Coord } from "floor/Tile";
import type { Grid } from "floor/Grid";
import type { Player } from "./player/Player";
import type { OperatorPlayer } from "./player/OperatorPlayer";
import type { GameMirror } from "./gameparts/GameMirror";

/**
 * **Important** To be properly disposed of, a game must first have
 * either naturally ended, or be paused- both operations of which will
 * properly cancel all internal scheduled callbacks (the callbacks
 * refer to players, which refer to their game, which refers to a
 * whole lot of other things such as the language dictionary, which
 * in some cases may be quite large.)
 *
 * Players can only join a game before it starts. Reconfiguration
 * requires creating a completely new game.
 *
 * There are overlaps between what each implementation needs to do:
 * - Offline and Server games maintain and control the master-game-state.
 * - Offline and Client games display the game-state to an operator via browser and HTML.
 * - Client  and Server games use network operations to communicate.
 */
export namespace Game {

	/**
	 * Unlike CtorArgs, these are not passed as no-prototype objects
	 * (possibly over the network) from the game manager to clients.
	 * These are abstract handles to game-implementation-dependant
	 * components.
	 */
	export type ImplArgs = {
		gridClassLookup<S extends Coord.System>(coordSys: S): Grid.ClassIf<S>;
		OperatorPlayer: typeof OperatorPlayer | undefined;
		RobotPlayer: (_this: GameMirror, desc: Player._CtorArgs[Player.RobotFamily]) => Player;
		onGameBecomeOver: () => void;
	};

	interface _CtorArgsBase<S extends Coord.System> {
		readonly coordSys: S;
		readonly gridDimensions: Grid.Dimensions[S];
		readonly langId: Lang.Desc["id"];
		readonly langWeightExaggeration: Lang.WeightExaggeration;
	}

	/**
	 * Game Constructor Arguments
	 *
	 * Important internal note: Upon modification, make appropriate
	 * changes to GameManager's function for verifying validity of
	 * client input on the server side.
	 *
	 * @template S
	 * The coordinate system to use. The literal value must also be
	 * passed as the field `coordSys`.
	 */
	export interface CtorArgs<S extends Coord.System = Coord.System> extends _CtorArgsBase<S> {
		readonly players: readonly Player.CtorArgs[];
	};
	export namespace CtorArgs {
		export interface UnFin<S extends Coord.System = Coord.System> extends _CtorArgsBase<S> {
			readonly players: readonly Player.CtorArgs.UnFin[];
		}
		/** */
		export type FailureReasons = {
			missingFields: Array<keyof CtorArgs<Coord.System>>;
		};
	}

	/**
	 * Serialization of the Game State after a reset.
	 *
	 * Only contains state information that would not be known by a
	 * non-Game Manager.
	 */
	export interface ResetSer {
		/**
		 * Indexed by index according to `Grid.forEach` - not by the
		 * `Tile.coord`s of `Grid.forEach` (they may differ).
		 */
		readonly csps: readonly Lang.Csp[];
		/**
		 * A map from player ID's to their starting coordinates.
		 */
		readonly playerCoords: readonly Coord[];
	};

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
	 *
	 * Keys beginning with an underscore are probably of no interest to
	 * people playing the game.
	 */
	export const K = Object.freeze(<const>{
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
		"PORTION_OF_MOVES_THAT_ARE_BOOST": 0.4,

		/**
		 * A strictly-positive integer. Indicates the maximum number
		 * of requests which a clientside player can buffer.
		 */
		_REQUEST_BUFFER_LENGTH: 5,

		/**
		 * How many times a Decisive RobotPlayer can reuse its cached
		 * target before it will do another cold analysis of its
		 * surroundings.
		 */
		_ROBOT_PRIORITY_MAX_REUSES: 4,
	});
}
Object.freeze(Game);