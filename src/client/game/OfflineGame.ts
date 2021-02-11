import {
	JsUtils, Game, Coord,
	VisibleGrid, Player,
} from "./BrowserGame";

import { GameManager }    from "game/gameparts/GameManager";
import { RobotPlayer }    from "game/player/RobotPlayer";
import { OperatorPlayer } from "game/player/OperatorPlayer";

import InitBrowserGameCtorMaps from "game/ctormaps/CmapBrowser";
InitBrowserGameCtorMaps();

/**
 * @final
 */
export class OfflineGame<S extends Coord.System = Coord.System> extends GameManager<"OFFLINE",S> {

	/** @override */
	declare readonly grid: VisibleGrid<S>;

	/**
	 */
	public constructor(
		onGameBecomeOver: () => void,
		gameDesc: Game.CtorArgs.UnFin<S>,
	) {
		super({
			impl: {
				gridClassLookup: VisibleGrid.getImplementation,
				OperatorPlayer: OperatorPlayer,
				RobotPlayer: (game, desc) => RobotPlayer.of(game as GameManager<"OFFLINE">, desc),
				onGameBecomeOver,
			},
			desc: (() => {
				Player.CtorArgs.finalize(gameDesc);
				return gameDesc;
			})(),
			operatorIds: gameDesc.players.filter(p => p.familyId === "HUMAN").map(p => p.playerId),
		});
		Object.seal(this); //🧊
	}

	// NOTE: Uncomment this block to simulate network delay for testing.
	// /** @override */
	// public processMoveRequest(req: StateChange.Req): void {
	// 	const func = () => super.processMoveRequest(req);
	// 	setTimeout(func, 1000);
	// }

	/** @override */
	public setTimeout(callback: TimerHandler, millis: number, ...args: any[]): number {
		return setTimeout(callback, millis, args);
	}

	/** @override */
	public cancelTimeout(handle: number): void {
		clearTimeout(handle);
	}
}
Object.freeze(OfflineGame);
Object.freeze(OfflineGame.prototype);