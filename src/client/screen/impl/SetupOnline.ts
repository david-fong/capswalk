import { SkScreen } from "../SkScreen";

import { SetupScreen } from "./Setup";


/**
 *
 */
export class SetupOnlineScreen extends SetupScreen<SkScreen.Id.SETUP_ONLINE> {

    public get initialScreen(): SkScreen.Id {
        return SkScreen.Id.GROUP_JOINER;
    }
    ;
}
Object.freeze(SetupOnlineScreen);
Object.freeze(SetupOnlineScreen.prototype);
