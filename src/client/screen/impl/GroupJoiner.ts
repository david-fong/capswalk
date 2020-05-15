import type { TopLevel } from "../../TopLevel";
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

    #state: GroupJoinerScreen.State;

    private readonly hostUrlInput:      HTMLInputElement;
    private readonly groupNameDataList: HTMLDataListElement;
    private readonly groupNameInput:    HTMLInputElement;
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
        const contentWrapper = this.__initializeScreenContents();

        this.hostUrlInput.oninput  = (ev) => this.setState(State.CHOOSING_HOST);
        this.hostUrlInput.onchange = (ev) => {
            if (this.hostUrlInput.validity.valid) {
                const top = this.toplevel;
                top.socketIo.then((io) => {
                    top.socket = io(this.hostUrlInput.value + SnakeyServer.Nsps.GROUP_JOINER, {
                        reconnectionAttempts: GroupSession.CtorArgs.JoinerReconnectionAttempts,
                    });
                    top.socket.once("connect", () => this.setState(State.CHOOSING_GROUP));
                    top.socket.once("connect_error", this.onHostConnectionFailure.bind(this));
                });
            }
        }

        this.groupNameInput.oninput  = (ev) => this.setState(State.CHOOSING_GROUP);
        this.groupNameInput.onchange = (ev) => {

        }

        this.setState(State.CHOOSING_HOST);
        this.baseElem.appendChild(contentWrapper);
    }

    /**
     * @override
     */
    protected async __abstractOnBeforeEnter(args: {}): Promise<void> {
        window.setTimeout(() => {
            // ^Setting a timeout is required for some reason...
            this.hostUrlInput.focus();
        }, 100);
    }

    public get state(): State {
        return this.#state;
    }
    /**
     * Does nothing if the `newState` argument is the same as the
     * current state.
     *
     * @param newState -
     */
    private setState(newState: State): void {
        if (this.state === newState) return;

        if (newState === State.READY_TO_PROCEED) {
            if (this.state !== State.CHOOSING_GROUP) {
                throw new Error("never");
            }
            this.nextButton.disabled = false;

        } else {
            this.nextButton.disabled = true;

            if (newState === State.CHOOSING_HOST) {
                this.toplevel.socket?.close();
                this.groupNameInput.disabled    = true;
                this.groupNameInput.value       = "";
                Array.from(this.groupNameDataList.children).forEach((child) => child.remove());
                this.passphraseInput.disabled   = true;
                this.passphraseInput.value      = "";
                this.hostUrlInput.focus();
                ;
            } else if (newState === State.CHOOSING_GROUP) {
                this.groupNameInput.disabled    = false;
                this.passphraseInput.disabled   = false;
                this.passphraseInput.value      = "";
                this.groupNameInput.focus();
            }
        }
        this.#state = newState;
    }

    private onHostConnectionFailure(): void {
        // TODO.impl make some visual indication.
    }

    private attemptToJoinGroup(url: string, passphrase: string): void {
        // TODO.design I don't need those arguments... I can just read direct from the input elements.
        // TODO. make sure to set query.passphrase.
        // See OnlineDefs.ts -> SnakeyServer.Nsps.GROUP_LOBBY_PREFIX
        if (this.state !== State.CHOOSING_GROUP) {
            throw new Error("never");
        }
    }

    public get socket(): SocketIOClient.Socket | undefined {
        return this.toplevel.socket;
    }

    /**
     * A helper for `__lazyLoad`. Does not hook up event processors.
     */
    // TODO.impl change this into a form and move input tags outside of their label tags.
    // This will allow us to use more appropriate styling control for their track sizes
    // _when_ we add description parts for each input. Size the description tracks using
    // `auto`, and everything else (ie. labels and inputs) using `fr` units.
    private __initializeScreenContents(): HTMLElement {
        const OMHC = OmHooks.Screen.Impl.GroupJoiner.Class;
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
                OMHC.HOST_URL,
            );
            {
                const suggestedHost = GroupJoinerScreen.SUGGEST_LAN_HOST_URL(this.toplevel.webpageHostType);
                if (suggestedHost) {
                    const suggestedHostOption = document.createElement("option");
                    suggestedHostOption.value = suggestedHost;
                    document.getElementById(OmHooks.GLOBAL_IDS.PUBLIC_GAME_HOST_URLS)!.appendChild(
                        suggestedHostOption,
                    );
                }
            }
            hostUrl.setAttribute("list", OmHooks.GLOBAL_IDS.PUBLIC_GAME_HOST_URLS);
            hostUrl.maxLength = 128;
            hostUrl.minLength = 1;
            // Label:
            const hostUrlLabel = document.createElement("label");
            hostUrlLabel.innerText = "Host Url";
            hostUrlLabel.appendChild(hostUrl);
            contentWrapper.appendChild(hostUrlLabel);
        }{
            const nspsList
                = (this.groupNameDataList as HTMLDataListElement)
                = document.createElement("datalist");
            this.baseElem.appendChild(nspsList);
        }{
            const nspsName
                = (this.groupNameInput as HTMLInputElement)
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
        return contentWrapper;
    }
}
export namespace GroupJoinerScreen {
    export enum State {
        CHOOSING_HOST,
        CHOOSING_GROUP,
        READY_TO_PROCEED,
    };
    /**
     *
     */
    export function SUGGEST_LAN_HOST_URL(webpageHostType: TopLevel.WebpageHostType): string {
        switch (webpageHostType) {
            case "github":
                // Use case: production. Load page resources from GitHub
                // Pages to reduce load on the game server, which is on
                // on the LAN. Only use the server for game management.
                return "";
            case "filesystem":
                // Use case: development. Load page resources directly from
                // the local filesystem. Server only used as a game manager.
                // In this case, suggest connecting to `localhost`.
                return "localhost:" + SnakeyServer.DEFAULT_PORT;
            case "lan-server":
                // Use case: production. Page resources are probably being
                // served by the LAN server already. Suggest connecting
                // Socket.IO to that same host. Just give origin (exclude
                // the URI's path, since Socket.IO interprets the path as
                // a namespace specifier).
                return window.location.origin;
            default: return "";
        }
    }
}
const State = GroupJoinerScreen.State;
type  State = GroupJoinerScreen.State;
Object.freeze(GroupJoinerScreen);
Object.freeze(GroupJoinerScreen.prototype);