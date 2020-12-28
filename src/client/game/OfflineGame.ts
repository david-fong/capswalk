import {
	JsUtils, Game, Coord, VisibleGrid,
	BrowserGameMixin,
	OperatorPlayer,
} from "./BrowserGame";

import { GamepartManager } from "game/gameparts/GamepartManager";
import type { StateChange } from "base/game/StateChange";


type G = Game.Type.OFFLINE;

/**
 */
export class OfflineGame<S extends Coord.System>
extends GamepartManager<G,S> implements BrowserGameMixin<G,S> {

	/**
	 */
	public constructor(
		onGameBecomeOver: () => void,
		gameDesc: Game.CtorArgs<G,S>,
	) {
		super(
			Game.Type.OFFLINE, {
			onGameBecomeOver,
			}, gameDesc,
		);
		this._ctorBrowserGame();
	}

	// NOTE: Uncomment this block to simulate network delay for testing.
	// /** @override */
	// public processMoveRequest(req: StateChange.Req): void {
	// 	const func = () => super.processMoveRequest(req);
	// 	setTimeout(func, 1000);
	// }

	/** @override */
	declare protected readonly _getGridImplementation: BrowserGameMixin<G,S>["_getGridImplementation"];

	/** @override */
	declare public readonly _createArtifPlayer: GamepartManager<G,S>["_createArtifPlayer"];

	/** @override */
	declare protected _createOperatorPlayer: BrowserGameMixin<G,S>["_createOperatorPlayer"];

	/** @override */
	declare protected readonly commitTileMods: GamepartManager<G,S>["commitTileMods"];

	/** @override */
	public setTimeout(callback: TimerHandler, millis: number, ...args: any[]): number {
		return setTimeout(callback, millis, args);
	}

	/** @override */
	public cancelTimeout(handle: number): void {
		clearTimeout(handle);
	}
}
export interface OfflineGame<S extends Coord.System> extends BrowserGameMixin<G,S> {

	/** @override */
	readonly htmlElements: BrowserGameMixin.HtmlElements;

	/** @override */
	readonly grid: VisibleGrid<S>;

	/** @override */
	// @ts-expect-error : Redeclaring accessor as property.
	readonly currentOperator: OperatorPlayer;
};
JsUtils.applyMixins(OfflineGame, [BrowserGameMixin]);
Object.freeze(OfflineGame);
Object.freeze(OfflineGame.prototype);