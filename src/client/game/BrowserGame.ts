import { JsUtils }          from "defs/JsUtils";                    export { JsUtils };
import { Game }             from "game/Game";                       export { Game };
import type { Coord }       from "floor/Coord";                     export { Coord };
import { VisibleGrid }      from "floor/visible/VisibleGrid";       export { VisibleGrid };
import { Player }           from "game/player/Player";              export { Player };
import { OperatorPlayer }   from "game/player/OperatorPlayer";      export { OperatorPlayer };
export type { StateChange } from "game/StateChange";

import InitBrowserGameCtorMaps from "game/ctormaps/CmapBrowser";
InitBrowserGameCtorMaps();