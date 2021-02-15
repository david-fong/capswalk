import { GameEv } from "defs/OnlineDefs";
import {
	JsUtils, Game, Coord, StateChange,
	VisibleGrid, Player,
} from "./BrowserGame";

import { GameMirror } from "game/gameparts/GameMirror";
import { OperatorPlayer } from "game/player/OperatorPlayer";

import InitBrowserGameCtorMaps from "game/ctormaps/CmapBrowser";
InitBrowserGameCtorMaps();

/**
 * Note that this class does not extend `GameManager`.
 * @final
 */
export class OnlineGame<S extends Coord.System = Coord.System> extends GameMirror<S> {

	/** @override */
	declare readonly grid: VisibleGrid<S>;

	public readonly socket: WebSocket;
	declare private readonly socketMessageCb: (ev: MessageEvent<string>) => void;

	/** */
	public constructor(
		socket: WebSocket,
		onGameBecomeOver: () => void,
		gameDesc: Game.CtorArgs<S>,
		operatorIds: TU.RoArr<Player.Id>,
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
		this.socket = socket;

		Object.defineProperty(this, "socketMessageCb", { value: (ev: MessageEvent<string>) => {
			const [evName, ...body] = JSON.parse(ev.data) as [string, ...any[]];
			switch (evName) {
				case GameEv.IN_GAME: this.commitStateChange(body[0]); break;
				case GameEv.RESET:
					this.reset();
					this.deserializeResetState(body[0]);
					// See the PlayOnline screen for the registration of
					// listeners for the server confirmation.
					this.socket.send(GameEv.UNPAUSE);
					break;
				default: break;
			}
		}, });
		Object.seal(this); //🧊

		this.socket.send(GameEv.RESET);
	}

	/**
	 * Normally, this immediately executes the changes. Here, that
	 * should be done as a callback to an event created by the server.
	 * > 💢 I would like to speak to your manager. I'll wait.
	 * @override
	 */
	public processMoveRequest(desc: StateChange.Req): void {
		this.socket.send(JSON.stringify([GameEv.IN_GAME, desc]));
	}
}
Object.freeze(OnlineGame);
Object.freeze(OnlineGame.prototype);