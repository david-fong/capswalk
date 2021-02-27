import {
	Game, Coord,
	VisibleGrid, Player, OperatorPlayer,
	InitBrowserGameCtorMaps,
} from "./BrowserGame";
InitBrowserGameCtorMaps();

import { GameManager }    from "game/gameparts/GameManager";
import { RobotPlayer }    from "game/player/RobotPlayer";

/**
 * @final
 */
export class OfflineGame<S extends Coord.System = Coord.System> extends GameManager<S> {

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
				RobotPlayer: (game, desc) => RobotPlayer.of(game as GameManager, desc),
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