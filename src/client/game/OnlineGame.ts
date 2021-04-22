import { GameEv } from ":defs/OnlineDefs";
import {
	Game, Coord, StateChange,
	VisibleGrid, Player, OperatorPlayer,
	InitBrowserGameCtorMaps,
} from "./BrowserGame";
InitBrowserGameCtorMaps();

import { GameMirror } from ":game/gameparts/GameMirror";

/**
 * Note that this class does not extend `GameManager`.
 * @final
 */
export class OnlineGame<S extends Coord.System = Coord.System> extends GameMirror<S> {

	/** @override */
	declare readonly grid: VisibleGrid<S>;

	public readonly ws: WebSocket;

	/** */
	public constructor(
		socket: WebSocket,
		onGameBecomeOver: () => void,
		gameDesc: Game.CtorArgs<S>,
		operatorIds: readonly Player.Id[],
	) {
		super({
			impl: {
				gridClassLookup: VisibleGrid.getImplementation,
				OperatorPlayer: OperatorPlayer,
				RobotPlayer: (game, desc) => new Player(game, desc),
				onGameBecomeOver,
			},
			desc: gameDesc,
			operatorIds,
		});
		this.ws = socket;
		Object.seal(this); //🧊
		this.ws.send(JSON.stringify([GameEv.RESET]));
	}

	/** */
	public wsMessageCb(ev: MessageEvent<string>): void {
		const [evName, ...body] = JSON.parse(ev.data) as [string, ...any[]];
		switch (evName) {
			case GameEv.IN_GAME: this.commitStateChange(body[0]); break;
			case GameEv.RESET:
				this.reset();
				this.deserializeResetState(body[0]);
				// See the PlayOnline screen for the registration of
				// listeners for the server confirmation.
				this.ws.send(JSON.stringify([GameEv.UNPAUSE]));
				break;
			default: break;
		}
	}

	/**
	 * Normally, this immediately executes the changes. Here, that
	 * should be done as a callback to an event created by the server.
	 * > 💢 I would like to speak to your manager. I'll wait.
	 * @override
	 */
	public requestStateChange(desc: StateChange.Req): void {
		this.ws.send(JSON.stringify([GameEv.IN_GAME, desc]));
	}
}
Object.freeze(OnlineGame);
Object.freeze(OnlineGame.prototype);