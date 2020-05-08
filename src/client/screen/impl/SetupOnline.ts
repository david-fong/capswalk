import type { SkScreen } from "../SkScreen";
import { SetupScreen } from "./Setup";


/**
 *
 */
export class SetupOnlineScreen extends SetupScreen<SkScreen.Id.SETUP_ONLINE> {

    public readonly canBeInitialScreen = false;
    ;
}
Object.freeze(SetupOnlineScreen);
Object.freeze(SetupOnlineScreen.prototype);
