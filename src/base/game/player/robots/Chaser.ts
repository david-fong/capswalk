
import {
	JsUtils,
	Coord, Tile,
	Player,
	GameManager,
	RobotPlayer,
} from "../RobotPlayer";


/**
 * @final
 */
export class Chaser extends RobotPlayer {

	private readonly pred: Array<Player>;
	private readonly prey: Array<Player>;

	private readonly behaviour: Required<Readonly<Chaser.Behaviour>>;

	private readonly grid: Chaser["game"]["grid"];

	public constructor(game: GameManager<any,any>, desc: Player._CtorArgs["CHASER"]) {
		super(game, desc);
		Object.seal(this);
		this.behaviour = Object.freeze(Object.assign(
			{},
			Chaser.Behaviour.DEFAULT,
			desc.familyArgs,
		));
		this.grid = this.game.grid;
	}

	public onTeamsBootstrapped(): void {
		super.onTeamsBootstrapped();
		// We need to cast off read-only-ness below.
		// @ts-expect-error : RO=
		this.pred = Object.seal(this.game.teams
			.filter((team) => team.id !== this.teamId)
			.flatMap((team) => team.members));

		// @ts-expect-error : RO=
		this.prey = Object.seal([...this.pred]);

		JsUtils.propNoWrite(this as Chaser,
			"pred", "prey",
			"behaviour", "grid",
		);
	}

	protected computeDesiredDest(): Coord {
		// Check if there is anyone to run away from:
		this.pred.sort((pa,pb) => {
			return this.grid.dist(pa.coord, this.coord)
				-  this.grid.dist(pb.coord, this.coord);
		});
		for (const threatP of this.pred) {
			if (this.grid.dist(threatP.coord, this.coord)
				> this.behaviour.fearDistance) break;
			if (threatP.status.isDowned) continue;
			if (threatP.status.health > this.status.health) {
				// TODO.design Something that avoids getting cornered.
				return this.grid.getUntAwayFrom(threatP.coord, this.coord).coord;
			}
		}
		// If there is nobody to run away from,
		// Check if there is anyone we want to attack:
		this.prey.sort((pa,pb) => {
			return this.grid.dist(this.coord, pa.coord)
				-  this.grid.dist(this.coord, pb.coord);
		});
		if (this.status.isDowned) {
			for (const targetP of this.prey) {
				if (this.grid.dist(this.coord, targetP.coord)
					> this.behaviour.bloodThirstDistance) break;
				if (targetP.status.health < this.status.health - this.behaviour.healthReserve) {
					return targetP.coord;
				}
			}
		}
		// If there is nobody we want to chase after to attack,
		// Head toward the nearest free health if it exists.
		if (this.game.health.tiles.size === 0) {
			// No tiles close by. Wander around:
			if (Math.random() < this.behaviour.wanderingAimlessness) {
				// Big direction change:
				return this.grid.getRandomCoordAround(this.coord, 3);
			} else {
				// Continue wandering with a subtle, random direction:
				const awayFunc = this.grid.getUntAwayFrom.bind(this.grid, this.prevCoord);
				return this.grid.getRandomCoordAround(
					awayFunc(awayFunc(this.coord).coord).coord,
					1,
				);
			}
		}
		let closestFht: Tile = undefined!;
		let closestFhtDistance = Infinity;
		for (const fht of this.game.health.tiles.values()) {
			const distance = this.grid.dist(this.coord, fht.coord);
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
JsUtils.protoNoEnum(Chaser, "onTeamsBootstrapped");
Object.freeze(Chaser);
Object.freeze(Chaser.prototype);