import { Coord }                from "floor/VisibleTile";
import { Game }                 from "game/Game";
import { GameBase }             from "game/__gameparts/Base";
import type { PlayerActionEvent } from "game/events/PlayerActionEvent";
import { Player }               from "game/player/Player";
import { OperatorPlayer }       from "game/player/OperatorPlayer";

export { applyMixins }          from "defs/TypeDefs";
export { Game }                 from "game/Game";
export { Coord, VisibleTile }   from "floor/VisibleTile";
export { VisibleGrid }          from "floor/VisibleGrid";

export { Player }               from "game/player/Player";
export { OperatorPlayer }       from "game/player/OperatorPlayer";
export { VisiblePlayerStatus }  from "game/player/VisiblePlayerStatus";

import { IndexTasks } from "game/IndexTasks";
IndexTasks.INIT_CLASS_REGISTRIES();


/**
 *
 */
export class BrowserGameMixin<G extends Game.Type.Browser, S extends Coord.System> {
    public readonly htmlElements: BrowserGameMixin.HtmlElements;
    public __BrowserGame_Ctor(): void {
        (this.htmlElements as BrowserGameMixin.HtmlElements) = Object.freeze({
            gridImpl: this.grid.baseElem,
            playersBar: document.createElement("div"), // TODO.design
        });
    }

    public __createOperatorPlayer(desc: Player.__CtorArgs<"HUMAN">): OperatorPlayer<S> {
        return new OperatorPlayer<S>(this, desc);
    }
}
export interface BrowserGameMixin<G extends Game.Type.Browser, S extends Coord.System> extends GameBase<G,S> {};
export namespace BrowserGameMixin {
    export type HtmlElements = Readonly<{
        gridImpl:   HTMLElement;
        playersBar: HTMLElement;
    }>;
}
Object.freeze(BrowserGameMixin);
Object.freeze(BrowserGameMixin.prototype);
