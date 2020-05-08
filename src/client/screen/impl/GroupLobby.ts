import { SkScreen } from "../SkScreen";


/**
 *
 */
export class GroupLobbyScreen extends SkScreen<SkScreen.Id.GROUP_LOBBY> {

    public readonly canBeInitialScreen = false;

    /**
     * @override
     */
    public __lazyLoad(): void {
        ;
    }
}
Object.freeze(GroupLobbyScreen);
Object.freeze(GroupLobbyScreen.prototype);
