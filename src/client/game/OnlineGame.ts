import type { Socket } from "socket.io-client";
import { GameEv } from "defs/OnlineDefs";
import {
	JsUtils, Game, Coord, VisibleGrid,
	BrowserGameMixin,
	Player, OperatorPlayer,
} from "./BrowserGame";

import type { StateChange } from "game/StateChange";
import { GameMirror } from "base/game/gameparts/GameMirror";


type G = Game.Type.ONLINE;

/**
 */
export class OnlineGame<S extends Coord.System>
extends GameMirror<G,S> implements BrowserGameMixin<G,S> {

	public readonly socket: Socket;

	/**
	 * Note that this class does not extend `GameManager`.
	 *
	 * @param gameSocket - Used to make a Game socket.
	 * @param gameDesc - This should come from a Server event by the name {@link GameEv.CREATE}.
	 */
	public constructor(
		onGameBecomeOver: () => void,
		gameSocket: Socket,
		gameDesc: Game.CtorArgs<G,S>,
	) {
		super(
			Game.Type.ONLINE, {
			onGameBecomeOver,
			}, gameDesc,
		);
		this.socket = gameSocket;
		this._ctorBrowserGame();

		if (DEF.DevAssert) {
			// Enforcer: SkSockets calls `offAny` upon socket disconnect.
			if (this.socket.hasListeners(GameEv.IN_GAME)
			 || this.socket.hasListeners(GameEv.RESET)
			) {
				throw new Error("never");
			}
		}
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
				this.socket.emit(GameEv.UNPAUSE);
			},
		);
		this.socket.emit(GameEv.RESET);
	}

	/** @override */
	declare protected readonly _getGridImplementation: BrowserGameMixin<G,S>["_getGridImplementation"];

	/** @override */
	protected _createArtifPlayer(desc: Player.CtorArgs): Player<S> {
		return new Player(this, desc);
	}

	/** @override */
	declare protected _createOperatorPlayer: BrowserGameMixin<G,S>["_createOperatorPlayer"];


	/**
	 * Normally immediately executes the changes. However, here,
	 * that should be done as a callback to an event created by the
	 * server.
	 *
	 * > 💢 I would like to speak to your manager. I'll wait.
	 *
	 * @override
	 */
	public processMoveRequest(desc: StateChange.Req): void {
		this.socket.emit(GameEv.IN_GAME, desc);
	}
}
export interface OnlineGame<S extends Coord.System> extends BrowserGameMixin<G,S> {

	/** @override */
	readonly htmlElements: BrowserGameMixin.HtmlElements;

	/** @override */
	readonly grid: VisibleGrid<S>;

	/** @override */
	// @ts-expect-error : Redeclaring accessor as property.
	readonly currentOperator: OperatorPlayer<S>;
};
JsUtils.applyMixins(OnlineGame, [BrowserGameMixin]);
Object.freeze(OnlineGame);
Object.freeze(OnlineGame.prototype);