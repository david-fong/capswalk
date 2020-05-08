import type { SkScreen } from '../SkScreen';
import { SetupScreen } from './Setup';


/**
 *
 */
export class SetupOfflineScreen extends SetupScreen<SkScreen.Id.SETUP_OFFLINE> {

    public readonly canBeInitialScreen = true;
    ;
}
Object.freeze(SetupOfflineScreen);
Object.freeze(SetupOfflineScreen.prototype);
