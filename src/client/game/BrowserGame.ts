import { Coord }                from "floor/VisibleTile";
import { Game }                 from "game/Game";
import { GamepartBase }         from "game/gameparts/GamepartBase";
import { Player }               from "game/player/Player";
import { OperatorPlayer }       from "game/player/OperatorPlayer";

export { applyMixins }          from "defs/TypeDefs";
export { Game };
export { Coord, VisibleTile }   from "floor/VisibleTile";
export { VisibleGrid }          from "floor/VisibleGrid";

export { Player };
export { OperatorPlayer };
export { VisiblePlayerStatus }  from "game/player/VisiblePlayerStatus";

import { GameBootstrap } from "game/GameBootstrap";
GameBootstrap.INIT_CLASS_REGISTRIES();


/**
 *
 */
export class BrowserGameMixin<G extends Game.Type.Browser, S extends Coord.System> {

    declare public readonly currentOperator: OperatorPlayer<S>;

    public readonly htmlElements: BrowserGameMixin.HtmlElements;

    public _ctorBrowserGame(): void {
        (this.htmlElements as BrowserGameMixin.HtmlElements) = Object.freeze({
            gridImpl: this.grid.baseElem,
            playersBar: document.createElement("div"), // TODO.design
        });
    }

    public _createOperatorPlayer(desc: Player._CtorArgs<"HUMAN">): OperatorPlayer<S> {
        return new OperatorPlayer<S>(this, desc);
    }
}
export interface BrowserGameMixin<G extends Game.Type.Browser, S extends Coord.System> extends GamepartBase<G,S> {};
export namespace BrowserGameMixin {
    export type HtmlElements = Readonly<{
        gridImpl:   HTMLElement;
        playersBar: HTMLElement;
    }>;
}
Object.freeze(BrowserGameMixin);
Object.freeze(BrowserGameMixin.prototype);
