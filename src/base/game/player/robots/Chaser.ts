import {
	JsUtils, Coord, Tile,
	GameManager, Player, RobotPlayer,
} from "../RobotPlayer";

/**
 * @final
 */
export class Chaser extends RobotPlayer.Decisive {

	private readonly pred: SealedArray<Player> = [];
	private readonly prey: Array<Player> = [];

	private readonly params: Readonly<Chaser.Behaviour>;
	declare protected readonly _behaviours: ReadonlyArray<RobotPlayer.Decisive.Behaviour>;

	private readonly grid: Chaser["game"]["grid"];

	public constructor(game: GameManager<any>, desc: Player._CtorArgs["CHASER"]) {
		super(game, desc);
		this.params = Object.freeze(Object.assign(
			{},
			Chaser.Behaviour.DEFAULT,
			desc.familyArgs,
		));
		this.grid = this.game.grid;
		Object.seal(this); //🧊
		JsUtils.propNoWrite(this as Chaser,
			"params", "grid",
		);
	}

	public onTeamsBootstrapped(): void {
		super.onTeamsBootstrapped();
		// We need to cast off read-only-ness below.
		// @ts-expect-error : RO=
		this.pred = this.game.teams
			.filter((team) => team.id !== this.teamId)
			.flatMap((team) => team.members)
			.seal();

		// @ts-expect-error : RO=
		this.prey = [...this.pred].seal();

		JsUtils.propNoWrite(this as Chaser,
			"pred", "prey",
		);
	}

	private _bhvrEvadePred(cachedPred?: Player.Id): RobotPlayer.Decisive.Next {
		if (cachedPred !== undefined) { return {
			dest: this.grid.getUntAwayFrom(this.game.players[cachedPred]!.coord, this.coord).coord,
		};}
		// Check if there is anyone to run away from:
		this.pred.sort((pa,pb) => {
			return this.grid.dist(pa.coord, this.coord)
				 - this.grid.dist(pb.coord, this.coord);
		});
		for (const pred of this.pred) {
			if (this.grid.dist(pred.coord, this.coord)
				> this.params.fearDistance) break;
			if (pred.isDowned) continue;
			if (pred.health > this.health) {
				// TODO.design Something that avoids getting cornered.
				return {
					dest: this.grid.getUntAwayFrom(pred.coord, this.coord).coord,
					target: pred.playerId,
				};
			}
		}
		return undefined;
	}
	private _bhvrChasePrey(cachedPrey?: Player.Id): RobotPlayer.Decisive.Next {
		if (cachedPrey !== undefined) { return {
			dest: this.game.players[cachedPrey]!.coord,
		};}
		// If there is nobody to run away from,
		// Check if there is anyone we want to attack:
		this.prey.sort((pa,pb) => {
			return this.grid.dist(this.coord, pa.coord)
				-  this.grid.dist(this.coord, pb.coord);
		});
		if (this.isDowned) { // TODO.design <-- what's this? I think I meant to check that the prey is not downed.
			for (const prey of this.prey) {
				if (this.grid.dist(this.coord, prey.coord)
					> this.params.bloodThirstDistance) break;
				if (prey.health < this.health - this.params.healthReserve) {
					return {
						dest: prey.coord,
						target: prey.playerId,
					};
				}
			}
		}
		return undefined;
	}
	private _bhvrGotoHealthElseWander(cachedHealthCoord?: Coord): RobotPlayer.Decisive.Next {
		if (cachedHealthCoord !== undefined && this.game.health.tiles.has(cachedHealthCoord)) {
			return { dest: cachedHealthCoord };
		}
		// If there is nobody we want to chase after to attack,
		// Head toward the nearest free health if it exists.
		if (this.game.health.tiles.size === 0) {
			// No tiles close by. Wander around:
			if (Math.random() < this.params.wanderingAimlessness) {
				// Big direction change:
				return { dest: this.grid.getRandomCoordAround(this.coord, 3) };
			} else {
				// Continue wandering with a subtle, random direction:
				const awayFunc = this.grid.getUntAwayFrom.bind(this.grid, this.prevCoord);
				return { dest: this.grid.getRandomCoordAround(
					awayFunc(awayFunc(this.coord).coord).coord, 1,
				)};
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
		return { dest: closestFht.coord, target: closestFht.coord };
	}

	protected getNextMoveType(): Player.MoveType {
		return Player.MoveType.NORMAL;
	}

	protected computeNextMovementTimer(): number {
		return 1000 / this.params.keyPressesPerSecond;
	}
}
export namespace Chaser {
	/**
	 */
	export type Behaviour = {
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
	};
	export namespace Behaviour {
		export const DEFAULT: Readonly<Behaviour> = Object.freeze({
			fearDistance: 5,
			bloodThirstDistance: 7,
			healthReserve: 3.0,
			keyPressesPerSecond: 2.0,
			wanderingAimlessness: 0.2,
		});
	}
}
// @ts-expect-error : RO=
Chaser.prototype._behaviours
= Object.freeze([
	Chaser.prototype["_bhvrEvadePred"],
	Chaser.prototype["_bhvrChasePrey"],
	Chaser.prototype["_bhvrGotoHealthElseWander"],
]);
JsUtils.protoNoEnum(Chaser, "onTeamsBootstrapped");
Object.freeze(Chaser);
Object.freeze(Chaser.prototype);