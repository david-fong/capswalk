import { OmHooks } from "defs/OmHooks";
import { SnakeyServer } from "defs/TypeDefs";

import { SkScreen } from "../SkScreen";


/**
 * This screen is like a form for joining a session on a remote host.
 */
// TODO.learn https://socket.io/docs/client-api/
// we will probably make use of the num-attempts/retries option.
export class GroupJoinerScreen extends SkScreen<SkScreen.Id.GROUP_JOINER> {

    public readonly canBeInitialScreen = false;

    private readonly netScopeSwitch:  HTMLElement;
    private readonly hostUrlInput:    HTMLInputElement; // TODO.impl make sure autocomplete is off for all of these.
    private readonly groupNameInput:  HTMLInputElement;
    private readonly passphraseInput: HTMLInputElement;

    private readonly backButton: HTMLButtonElement;
    private readonly nextButton: HTMLButtonElement;

    /**
     * @override
     */
    protected __lazyLoad(): void {
        this.baseElem.classList.add(OmHooks.Screen.Impl.GroupJoiner.Class.BASE);
        this.baseElem.setAttribute("aria-label", "Group Joiner Screen");

        // Connect to a host on ["a public server" | "the local network"]

        const suggestedHostUrl = GroupJoinerScreen.SUGGEST_LAN_HOST_URL();
    }

    /**
     * @override
     */
    protected async __abstractOnBeforeEnter(args: {}): Promise<void> {
        this.nextButton.disabled = !(this.socket);
    }

    /**
     * Always closes the current socket, if there is one.
     *
     * @param url -
     */
    private attemptConnectToHost(url: string): void {
        const top = this.toplevel;
        if (top.socket) {
            top.socket.removeAllListeners();
            top.socket.close();
        }
        top.socketIo.then((io) => {
            top.socket = io(url, {
                //query: {},
                //timeout:
            });
            top.socket.once("connect", this.onHostConnectionSuccess.bind(this));
            top.socket.once("connect", this.onHostConnectionFailure.bind(this));
        });
    }

    private onHostConnectionSuccess(): void {
        this.nextButton.disabled = false;
    }

    private onHostConnectionFailure(): void {
        ;
    }

    public get socket(): typeof io.Socket | undefined {
        return this.toplevel.socket;
    }
}
export namespace GroupJoinerScreen {
    /**
     *
     */
    export function SUGGEST_LAN_HOST_URL(): string {
        if (window.location.origin.match(/github\.io/)) {
            // Use case: production. Load page resources from GitHub
            // Pages to reduce load on the game server, which is on
            // on the LAN. Only use the server for game management.
            return ""; // No suggestion.

        } else if (window.location.protocol.startsWith("file")) {
            // Use case: development. Load page resources directly from
            // the local filesystem. Server only used as a game manager.
            // In this case, suggest connecting to `localhost`.
            return "localhost:" + SnakeyServer.DEFAULT_PORT;

        } else {
            // Use case: production. Page resources are probably being
            // served by the LAN server already. Suggest connecting
            // Socket.IO to that same host. Just give origin (exclude
            // the URI's path, since Socket.IO interprets the path as
            // a namespace specifier).
            return window.location.origin;
        }
    }
}
Object.freeze(GroupJoinerScreen);
Object.freeze(GroupJoinerScreen.prototype);