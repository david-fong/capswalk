import {
	Game, Coord,
	VisibleGrid, Player, ClientPlayer,
	GetVisibleGridImpl,
} from "./BrowserGame";

import { GameManager } from ":game/gameparts/GameManager";
import { GetRobotImpl } from ":game/player/robot/ImplBarrel";

/**
 * @final
 */
export class OfflineGame<S extends Coord.System = Coord.System> extends GameManager<S> {

	/** @override */
	declare public readonly grid: VisibleGrid<S>;

	/** */
	public constructor(
		onGameBecomeOver: () => void,
		gameDesc: Game.CtorArgs.UnFin<S>,
	) {
		super({
			impl: {
				gridClassLookup: GetVisibleGridImpl,
				ClientPlayer,
				RobotPlayer: GetRobotImpl,
				onGameBecomeOver,
			},
			desc: (() => {
				Player.CtorArgs.finalize(gameDesc);
				return gameDesc;
			})(),
			clientPlayerIds: gameDesc.players.filter(p => p.familyId === "Human").map(p => p.playerId),
		});
		Object.seal(this); //🧊
	}

	// NOTE: Uncomment this block to simulate network delay for testing.
	// /** @override */
	// public processMoveRequest(req: StateChange.Req): void {
	// 	const func = () => super.processMoveRequest(req);
	// 	setTimeout(func, 1000);
	// }
}
Object.freeze(OfflineGame);
Object.freeze(OfflineGame.prototype);