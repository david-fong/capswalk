import { Game }                 from "game/Game";                       export { Game };
import { Coord, VisibleTile }   from "floor/VisibleTile";               export { Coord, VisibleTile };
import { VisibleGrid }          from "floor/VisibleGrid";
import { GamepartBase }         from "game/gameparts/GamepartBase";
import { Player }               from "game/player/Player";              export { Player };
import { OperatorPlayer }       from "game/player/OperatorPlayer";      export { OperatorPlayer };

import { JsUtils }              from "defs/JsUtils";                    export { JsUtils };
export { VisiblePlayerStatus }  from "game/player/VisiblePlayerStatus";

import { _INIT_BASIC_CLASS_REGISTRIES, _INIT_CLIENTSIDE_CLASS_REGISTRIES } from "game/GameBootstrap";
_INIT_BASIC_CLASS_REGISTRIES();
_INIT_CLIENTSIDE_CLASS_REGISTRIES();


/**
 *
 */
export class BrowserGameMixin<G extends Game.Type.Browser, S extends Coord.System> {

    declare public readonly currentOperator: OperatorPlayer<S>;

    public readonly htmlElements: BrowserGameMixin.HtmlElements;

    /**
     * Classes using this mixin should call this somewhere in their
     * constructor.
     */
    public _ctorBrowserGame(): void {
        // @ts-expect-error : RO=
        this.htmlElements = Object.freeze<BrowserGameMixin.HtmlElements>({
            gridImpl: this.grid.baseElem,
            playersBar: document.createElement("div"), // TODO.design
        });
        JsUtils.propNoWrite(this as BrowserGameMixin<G,S>, ["htmlElements"]);
    }

    /**
     * @override
     */
    protected _getGridImplementation(coordSys: S): VisibleGrid.ClassIf<S> {
        return VisibleGrid.getImplementation(coordSys);
    }

    /**
     * @override
     */
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
JsUtils.protoNoEnum(BrowserGameMixin, ["_getGridImplementation"]);
Object.freeze(BrowserGameMixin);
Object.freeze(BrowserGameMixin.prototype);