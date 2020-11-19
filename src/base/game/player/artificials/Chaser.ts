
import {
	JsUtils,
	Coord, Tile,
	Player,
	GamepartManager,
	ArtificialPlayer,
} from "../ArtificialPlayer";


/**
 *
 * @extends ArtificialPlayer
 */
export class Chaser<S extends Coord.System> extends ArtificialPlayer<S> {

	private readonly threatProximity: Array<Player<S>>;
	private readonly targetProximity: Array<Player<S>>;

	private readonly behaviour: Required<Readonly<Chaser.Behaviour>>;

	private readonly grid: Chaser<S>["game"]["grid"];
	#prevCoord: Coord[S];

	public constructor(game: GamepartManager<any,S>, desc: Player._CtorArgs<"CHASER">) {
		super(game, desc);
		this.behaviour = Object.freeze(Object.assign(
			{},
			Chaser.Behaviour.DEFAULT,
			desc.familyArgs,
		));
		this.grid = this.game.grid;
	}

	public _afterAllPlayersConstruction(): void {
		super._afterAllPlayersConstruction();
		// We need to cast off read-only-ness below.
		// @ts-expect-error : RO=
		this.threatProximity = this.game.teams
			.filter((team) => team.id !== this.teamId)
			.flatMap((team) => team.members);

		// @ts-expect-error : RO=
		this.targetProximity = [...this.threatProximity];

		JsUtils.propNoWrite(this as Chaser<S>, [
			"threatProximity", "targetProximity",
			"behaviour", "grid",
		]);
	}

	public reset(spawnTile: Tile<S>): void {
		super.reset(spawnTile);
		this.#prevCoord = this.coord;
	}

	public moveTo(dest: Tile<S>): void {
		this.#prevCoord = this.coord;
		super.moveTo(dest);
	}

	protected computeDesiredDest(): Coord[S] {
		// Check if there is anyone to run away from:
		this.threatProximity.sort((pa,pb) => {
			return this.grid.minMovesFromTo(pa.coord, this.coord)
				-  this.grid.minMovesFromTo(pb.coord, this.coord);
		});
		for (const threatP of this.threatProximity) {
			if (this.grid.minMovesFromTo(threatP.coord, this.coord)
				> this.behaviour.fearDistance) break;
			if (threatP.status.isDowned) continue;
			if (threatP.status.health > this.status.health) {
				// TODO.design Something that avoids getting cornered.
				return this.grid.getUntAwayFrom(threatP.coord, this.coord).coord;
			}
		}
		// If there is nobody to run away from,
		// Check if there is anyone we want to attack:
		this.targetProximity.sort((pa,pb) => {
			return this.grid.minMovesFromTo(this.coord, pa.coord)
				-  this.grid.minMovesFromTo(this.coord, pb.coord);
		});
		if (this.status.isDowned) {
			for (const targetP of this.targetProximity) {
				if (this.grid.minMovesFromTo(this.coord, targetP.coord)
					> this.behaviour.bloodThirstDistance) break;
				if (targetP.status.health < this.status.health - this.behaviour.healthReserve) {
					return targetP.coord;
				}
			}
		}
		// If there is nobody we want to chase after to attack,
		// Head toward the nearest free health if it exists.
		if (this.game.freeHealthTiles.size === 0) {
			// No tiles close by. Wander around:
			if (Math.random() < this.behaviour.wanderingAimlessness) {
				// Big direction change:
				return this.grid.getRandomCoordAround(this.coord, 3);
			} else {
				// Continue wandering with a subtle, random direction:
				const awayFunc = this.grid.getUntAwayFrom.bind(this.grid, this.#prevCoord);
				return this.grid.getRandomCoordAround(
					awayFunc(awayFunc(this.coord).coord).coord,
					1,
				);
			}
		}
		let closestFht: Tile<S> = undefined!;
		let closestFhtDistance = Infinity;
		for (const fht of this.game.freeHealthTiles) {
			const distance = this.grid.minMovesFromTo(this.coord, fht.coord);
			if (distance < closestFhtDistance) {
				closestFht = fht;
				closestFhtDistance = distance;
			}
		}
		return closestFht.coord;
	}

	protected getNextMoveType(): Player.MoveType {
		return Player.MoveType.NORMAL;
	}

	protected computeNextMovementTimer(): number {
		return 1000 / this.behaviour.keyPressesPerSecond;
	}
}
export namespace Chaser {
	/**
	 *
	 */
	export type Behaviour = Partial<{
		/**
		 * If the number of moves it would take for an opponent with
		 * more health than this player to reach this player is less
		 * than or equal to this value, then this player will try to
		 * run away to safety.
		 */
		fearDistance: number;
		/**
		 * If the number of moves it would take for this player to reach
		 * an opponent with less health is greater than this value,
		 * this player will not even consider pursuing them in attack.
		 */
		bloodThirstDistance: number;
		/**
		 * The minimum amount of leftover health this player would try
		 * to ensure having before going after an opponent. Negative
		 * values are allowed, in which case, the player will go after
		 * opponents even if they would end up being downed as a result.
		 */
		healthReserve: number;
		/**
		 * How often this player moves in units of moves-per-second.
		 */
		keyPressesPerSecond: number;
		/**
		 * A value between zero and one. How often this player will
		 * make a drastic random change in direction when wandering.
		 */
		wanderingAimlessness: number;
	}>;
	export namespace Behaviour {
		export const DEFAULT: Required<Readonly<Behaviour>> = Object.freeze({
			fearDistance: 5,
			bloodThirstDistance: 7,
			healthReserve: 3.0,
			keyPressesPerSecond: 2.0,
			wanderingAimlessness: 0.2,
		});
	}
}
JsUtils.protoNoEnum(Chaser, ["_afterAllPlayersConstruction"]);
Object.freeze(Chaser);
Object.freeze(Chaser.prototype);