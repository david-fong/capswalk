import { JsUtils } from "defs/JsUtils";
import { Game } from "../Game";
import type { Coord, Tile } from "floor/Tile";
import type { Grid } from "floor/Grid";

/**
 * @final
 */
export class HealthInfo {

	public readonly K: HealthInfo.K;
	#currentAmount: number = 0.0;
	public readonly tiles = new Map<Coord, Tile>();

	public get currentAmount(): number { return this.#currentAmount; }

	public constructor(
		desc: Game.CtorArgs,
		gridStatic: Grid.ClassIf<Coord.System>,
	) {
		const baseCostOfBoost = Game.K._HEALTH_COST_OF_BOOST(
			desc.averageHealthPerTile,
			gridStatic.getLatticePatchDiameter,
		);
		this.K = Object.freeze({
			avg: desc.averageHealthPerTile * gridStatic.getArea(desc.gridDimensions),
			avgPerTile: desc.averageHealthPerTile,
			costOfBoost: (dest: Tile) => baseCostOfBoost / dest.seq.length,
		});
		JsUtils.propNoWrite(this as HealthInfo, "K");
		Object.seal(this); //🧊
	}

	public reset(): void {
		this.#currentAmount = 0.0;
		this.tiles.clear();
	}

	public add(amount: number): void {
		this.#currentAmount += amount;
	}
}
export namespace HealthInfo {
	export interface K {
		readonly avg: number;
		readonly avgPerTile: number;
		readonly costOfBoost: (dest: Tile) => number;
	}
}
Object.freeze(HealthInfo);
Object.freeze(HealthInfo.prototype);