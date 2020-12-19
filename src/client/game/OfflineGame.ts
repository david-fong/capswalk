import {
	JsUtils,
	Game,
	Coord,
	BrowserGameMixin,
	// Player, OperatorPlayer,
} from "./BrowserGame";

import { GamepartManager } from "game/gameparts/GamepartManager";


type G = Game.Type.OFFLINE;

/**
 */
export class OfflineGame<S extends Coord.System>
extends GamepartManager<G,S> implements BrowserGameMixin<G,S> {

	/** @override */
	// @ts-expect-error : Redeclaring accessor as property.
	declare public currentOperator: NonNullable<GamepartManager<G,S>["currentOperator"]>;

	/** @override */
	declare public htmlElements: BrowserGameMixin.HtmlElements;

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

	/** @override */
	declare protected readonly _getGridImplementation: BrowserGameMixin<G,S>["_getGridImplementation"];

	/** @override */
	declare public readonly _createArtifPlayer: GamepartManager<G,S>["_createArtifPlayer"];

	/** @override */
	public setTimeout(callback: TimerHandler, millis: number, ...args: any[]): number {
		return setTimeout(callback, millis, args);
	}

	/** @override */
	public cancelTimeout(handle: number): void {
		clearTimeout(handle);
	}
}
export interface OfflineGame<S extends Coord.System> extends BrowserGameMixin<G,S> {};
JsUtils.applyMixins(OfflineGame, [BrowserGameMixin]);
Object.freeze(OfflineGame);
Object.freeze(OfflineGame.prototype);