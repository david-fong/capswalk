import { OmHooks } from "defs/OmHooks";
import { GroupSession } from "defs/OnlineDefs";
import { SnakeyServer } from "defs/OnlineDefs";

import { SkScreen } from "../SkScreen";


/**
 * This screen is like a form for joining a session on a remote host.
 */
// TODO.learn https://socket.io/docs/client-api/
// we will probably make use of the num-attempts/retries option.
export class GroupJoinerScreen extends SkScreen<SkScreen.Id.GROUP_JOINER> {

    public readonly canBeInitialScreen = false;

    private readonly hostUrlInput:      HTMLInputElement;
    private readonly nspsNameDataList:  HTMLDataListElement;
    private readonly nspsNameInput:     HTMLInputElement;
    private readonly passphraseInput:   HTMLInputElement;

    private readonly backButton: HTMLButtonElement;
    private readonly nextButton: HTMLButtonElement;

    /**
     * @override
     */
    protected __lazyLoad(): void {
        const OMHC = OmHooks.Screen.Impl.GroupJoiner.Class;
        this.baseElem.classList.add(
            OmHooks.General.Class.CENTER_CONTENTS,
            OMHC.BASE,
        );

        const contentWrapper = document.createElement("div");
        contentWrapper.classList.add(
            OmHooks.General.Class.INPUT_GROUP,
            OMHC.CONTENT_WRAPPER,
        );
        {
            const hostUrl
                = (this.hostUrlInput as HTMLInputElement)
                = document.createElement("input");
            hostUrl.type = "url";
            hostUrl.classList.add(
                OmHooks.General.Class.INPUT_GROUP_ITEM,
                OMHC.LAN_HOST_URL,
            );
            hostUrl.setAttribute("list", OmHooks.GLOBAL_IDS.PUBLIC_GAME_HOST_URLS);
            hostUrl.value = GroupJoinerScreen.SUGGEST_LAN_HOST_URL();
            hostUrl.maxLength = 128;
            // Label:
            const hostUrlLabel = document.createElement("label");
            hostUrlLabel.innerText = "Host Url";
            hostUrlLabel.appendChild(hostUrl);
            contentWrapper.appendChild(hostUrlLabel);
        }{
            const nspsList
                = (this.nspsNameDataList as HTMLDataListElement)
                = document.createElement("datalist");
            this.baseElem.appendChild(nspsList);
        }{
            const nspsName
                = (this.nspsNameInput as HTMLInputElement)
                = document.createElement("input");
            nspsName.type = "text";
            nspsName.classList.add(
                OmHooks.General.Class.INPUT_GROUP_ITEM,
                OMHC.GROUP_NAME,
            );
            nspsName.autocomplete = "off";
            nspsName.pattern = GroupSession.GroupNspsName.REGEXP.source;
            nspsName.maxLength = GroupSession.CtorArgs.GroupNspsNameMaxLength;
            // Label:
            const nspsNameLabel = document.createElement("label");
            nspsNameLabel.innerText = "Group Name";
            nspsNameLabel.appendChild(nspsName);
            contentWrapper.appendChild(nspsNameLabel);
        }{
            const pass
                = (this.passphraseInput as HTMLInputElement)
                = document.createElement("input");
            pass.type = "text";
            pass.classList.add(
                OmHooks.General.Class.INPUT_GROUP_ITEM,
                OMHC.PASSPHRASE,
            );
            pass.autocomplete = "off";
            pass.maxLength = GroupSession.CtorArgs.PassphraseMaxLength;
            // Label:
            const passLabel = document.createElement("label");
            passLabel.innerText = "Passphrase";
            passLabel.appendChild(pass);
            contentWrapper.appendChild(passLabel);
        }{
            const nextBtn
                = (this.nextButton as HTMLButtonElement)
                = document.createElement("button");
            nextBtn.classList.add(OMHC.NEXT_BUTTON);
            nextBtn.innerText = "Next";
            contentWrapper.appendChild(nextBtn);
        }
        this.baseElem.appendChild(contentWrapper);
    }

    /**
     * @override
     */
    protected async __abstractOnBeforeEnter(args: {}): Promise<void> {
        this.nextButton.disabled = !(this.socket);
        window.setTimeout(() => {
            // ^Setting a timeout is required for some reason...
            this.hostUrlInput.focus();
        }, 100);
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
            top.socket = io(url + SnakeyServer.Nsps.GROUP_JOINER, {});
            top.socket.once("connect", this.onHostConnectionSuccess.bind(this));
            top.socket.once("connect_error", this.onHostConnectionFailure.bind(this));
        });
    }

    private attemptToJoinGroup(url: string, passphrase: string): void {
        // TODO.design I don't need those arguments... I can just read direct from the input elements.
        // TODO. make sure to set query.passphrase.
        // See OnlineDefs.ts -> SnakeyServer.Nsps.GROUP_LOBBY_PREFIX
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