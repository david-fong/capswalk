import { Game }                 from "game/Game";                       export { Game };
import { Coord, VisibleTile }   from "floor/VisibleTile";               export { Coord, VisibleTile };
import { VisibleGrid }          from "floor/VisibleGrid";
import { GamepartBase }         from "game/gameparts/GamepartBase";
import { Player }               from "game/player/Player";              export { Player };
import { OperatorPlayer }       from "game/player/OperatorPlayer";      export { OperatorPlayer };

export { applyMixins }          from "defs/TypeDefs";
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
        // @ts-expect-error : RO=
        this.htmlElements = Object.freeze({
            gridImpl: this.grid.baseElem,
            playersBar: document.createElement("div"), // TODO.design
        });
    }

    protected _getGridImplementation(coordSys: S): VisibleGrid.ClassIf<S> {
        return VisibleGrid.getImplementation(coordSys);
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