import { JsUtils }          from "defs/JsUtils";                    export { JsUtils };
import { Game }             from "game/Game";                       export { Game };
import type { Coord }       from "floor/Coord";                     export { Coord };
import { VisibleGrid }      from "floor/visible/VisibleGrid";       export { VisibleGrid };
import type { GameMirror }  from "game/gameparts/GameMirror";
import { Player }           from "game/player/Player";              export { Player };
import { OperatorPlayer }   from "game/player/OperatorPlayer";      export { OperatorPlayer };
export type { StateChange } from "game/StateChange";

import InitBrowserGameCtorMaps from "game/ctormaps/CmapBrowser";
InitBrowserGameCtorMaps();

/**
 *
 */
export class BrowserGameMixin<G extends Game.Type.Browser, S extends Coord.System> {

	declare public readonly grid: VisibleGrid<S>;

	declare public readonly currentOperator: OperatorPlayer;

	public readonly htmlElements: BrowserGameMixin.HtmlElements;

	/**
	 * Classes using this mixin should call this after calling the
	 * super constructor.
	 */
	public _ctorBrowserGame(): void {
		// @ts-expect-error : RO=
		this.htmlElements = Object.freeze<BrowserGameMixin.HtmlElements>({
			grid: this.grid.baseElem,
			playersBar: document.createElement("div"), // TODO.design
		});
		JsUtils.propNoWrite(this as BrowserGameMixin<G,S>, "htmlElements");
	}

	/** @override */
	protected _getGridImplementation(coordSys: S): VisibleGrid.ClassIf<S> {
		return VisibleGrid.getImplementation(coordSys);
	}

	/** @override */
	protected _createOperatorPlayer(desc: Player._CtorArgs["HUMAN"]): OperatorPlayer {
		return new OperatorPlayer(this, desc);
	}
}
export interface BrowserGameMixin<G extends Game.Type.Browser, S extends Coord.System> extends GameMirror<G,S> {};
export namespace BrowserGameMixin {
	export type HtmlElements = Readonly<{
		grid:   HTMLElement;
		playersBar: HTMLElement;
		// TODO.design seqBuffer
	}>;
}
JsUtils.protoNoEnum(BrowserGameMixin, "_getGridImplementation");
Object.freeze(BrowserGameMixin);
Object.freeze(BrowserGameMixin.prototype);