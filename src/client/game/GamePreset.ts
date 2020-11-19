import type { Game } from "game/Game";
import type { Coord } from "floor/Coord";

/**
 *
 */
export class GamePreset {
	;
	private readonly _loremIpsum: Game.CtorArgs<Game.Type.OFFLINE,Coord.System>;
}
Object.freeze(GamePreset);
Object.freeze(GamePreset.prototype);