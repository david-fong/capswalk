import { SkScreen } from "../SkScreen";


/**
 * This screen is like a form for joining a session on a remote host.
 */
// TODO.learn https://socket.io/docs/client-api/
// we will probably make use of the num-attempts/retries option.
export class GroupJoinerScreen extends SkScreen<SkScreen.Id.GROUP_JOINER> {

    private readonly netScopeSwitch:  HTMLElement;
    private readonly hostUrlInput:    HTMLInputElement;
    private readonly groupNameInput:  HTMLInputElement;
    private readonly passphraseInput: HTMLInputElement;

    private readonly backButton: HTMLButtonElement;
    private readonly nextButton: HTMLButtonElement;

    /**
     * @override
     */
    protected __lazyLoad(): void {
    }

}
Object.freeze(GroupJoinerScreen);
Object.freeze(GroupJoinerScreen.prototype);
