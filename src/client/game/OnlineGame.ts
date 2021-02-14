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
 * @final
 */
export class OnlineGame<S extends Coord.System = Coord.System> extends GameMirror<S> {

	/** @override */
	declare readonly grid: VisibleGrid<S>;

	public readonly socket: WebSocket;

	/**
	 * Note that this class does not extend `GameManager`.
	 *
	 * @param gameSocket - Used to make a Game socket.
	 * @param gameDesc - This should come from a Server event by the name {@link GameEv.CREATE}.
	 */
	public constructor(
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
		this.socket = gameSocket;
		Object.seal(this); //🧊

		this.socket.on(
			GameEv.IN_GAME,
			this.commitStateChange.bind(this),
		);
		this.socket.on(
			GameEv.RESET,
			async (ser: Game.ResetSer) => {
				await this.reset();
				this.deserializeResetState(ser);
				// See the PlayOnline screen for the registration of
				// listeners for the server confirmation.
				this.socket.send(GameEv.UNPAUSE);
			},
		);
		this.socket.send(GameEv.RESET);
	}


	/**
	 * Normally, this immediately executes the changes. Here, that
	 * should be done as a callback to an event created by the server.
	 *
	 * > 💢 I would like to speak to your manager. I'll wait.
	 *
	 * @override
	 */
	public processMoveRequest(desc: StateChange.Req): void {
		this.socket.send(JSON.stringify([GameEv.IN_GAME, desc]));
	}
}
Object.freeze(OnlineGame);
Object.freeze(OnlineGame.prototype);