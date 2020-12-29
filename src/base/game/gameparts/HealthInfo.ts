import { JsUtils } from "defs/JsUtils";
import { Game } from "../Game";
import type { Coord, Tile } from "floor/Tile";
import type { Grid } from "floor/Grid";
import { Player as _Player } from "defs/TypeDefs";

export class HealthInfo {

	public readonly K: HealthInfo.K;
	#currentAmount: number = 0.0;
	public readonly tiles = new Map<Coord, Tile>();

	public get currentAmount() { return this.#currentAmount; }

	public constructor(
		desc: Game.CtorArgs<Game.Type.Manager,Coord.System>,
		gridStatic: Grid.ClassIf<Coord.System>,
	) {
		this.K = Object.freeze({
			avg: desc.averageHealthPerTile * gridStatic.getArea(desc.gridDimensions),
			avgPerTile: desc.averageHealthPerTile,
			costOfBoost: Game.K.HEALTH_COST_OF_BOOST(
				desc.averageHealthPerTile,
				gridStatic.getLatticePatchDiameter,
			),
		});
		JsUtils.propNoWrite(this as HealthInfo, "K");
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
		readonly costOfBoost: number;
	}
}
Object.freeze(HealthInfo);
Object.freeze(HealthInfo.prototype);