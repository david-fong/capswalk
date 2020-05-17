import type { TopLevel } from "../../TopLevel";
import { OmHooks } from "defs/OmHooks";
import { Group } from "defs/OnlineDefs";
import { SkServer } from "defs/OnlineDefs";

import { SkScreen } from "../SkScreen";


/**
 * This screen is like a form for joining a session on a remote host.
 */
export class GroupJoinerScreen extends SkScreen<SkScreen.Id.GROUP_JOINER> {

    public readonly canBeInitialScreen = false;

    #state: GroupJoinerScreen.State;

    private readonly hostUrlInput:      HTMLInputElement;
    private readonly groupNameDataList: HTMLDataListElement;
    private readonly groupNameInput:    HTMLInputElement;
    private readonly passphraseInput:   HTMLInputElement;

    private readonly backButton: HTMLButtonElement;
    private readonly nextButton: HTMLInputElement;

    /**
     * @override
     */
    protected __lazyLoad(): void {
        const OMHC = OmHooks.Screen.Impl.GroupJoiner.Class;
        this.baseElem.classList.add(
            OmHooks.General.Class.CENTER_CONTENTS,
            OMHC.BASE,
        );
        const contentWrapper = this.__initializeFormContents();
        this.__initializeHostUrlHandlers();

        this.groupNameInput.oninput  = (ev) => {
            // TODO.fix we also need to switch back to the joiner namespace!!!
            this.__setFormState(State.CHOOSING_GROUP);
        }
        this.groupNameInput.onchange = (ev) => {
            const input = this.groupNameInput;
            if (input.value && input.validity.valid) {
                this.passphraseInput.focus();
            }
        };
        this.__initializePassphraseHandlers();

        this.__setFormState(State.CHOOSING_HOST);
        contentWrapper.onsubmit = (ev) => {
            // TODO change the screen nav flow to use the correct (commented out) values.
            if (false /* TODO this.isGroupOwner */) {
                this.requestGoToScreen(SkScreen.Id.PLAY_ONLINE, {});
                //this.requestGoToScreen(SkScreen.Id.SETUP_ONLINE, {});
            } else {
                this.requestGoToScreen(SkScreen.Id.PLAY_ONLINE, {});
                //this.requestGoToScreen(SkScreen.Id.GROUP_LOBBY, {});
            }
        }
        this.baseElem.appendChild(contentWrapper);
    }

    /**
     * @override
     */
    protected async __abstractOnBeforeEnter(args: {}): Promise<void> {
        window.setTimeout(() => {
            if (this.socket && this.socket.nsp.startsWith(SkServer.Nsps.GROUP_LOBBY_PREFIX)) {
                // Default to switching groups under the same host:
                this.groupNameInput.focus();
            } else {
                // We aren't connected to a host, or aren't yet in a group:
                this.hostUrlInput.focus();
            }
        }, 100); // <-- An arbitrary short period of time. See super doc.
    }

    public get state(): State {
        return this.#state;
    }
    /**
     * _Does nothing if the `newState` argument is the same as the
     * current state._ Doesn't touch sockets.
     *
     * @param newState -
     */
    private __setFormState(newState: State): void {
        if (this.state === newState) return;

        if (newState === State.IN_GROUP) {
            if (this.state !== State.CHOOSING_GROUP) {
                throw new Error("never"); // Illegal state transition.
            }
            this.nextButton.disabled = false;
            this.nextButton.focus();

        } else {
            this.nextButton.disabled = true;

            if (newState === State.CHOOSING_HOST) {
                this.socket = undefined;
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

    /**
     *
     */
    private __initializeHostUrlHandlers(): void {
        const top = this.toplevel;
        const input = this.hostUrlInput;
        input.oninput = (ev) => this.__setFormState(State.CHOOSING_HOST);
        input.onkeydown = (ev) => {
            if (ev.key === "Enter"
            && (this.socket ? this.socket.connected : true)
            ) input.dispatchEvent(new Event("change"));
            // Force the change event on pressing enter, but don't
            // do it if we are currently trying to connect to a host.
        };
        input.onchange = async (ev) => {
            if (!input.value || !input.validity.valid) return;
            if (!input.value.match(/^https?:\/\//)) {
                input.value = SkServer.PROTOCOL + input.value;
            }
            this.socket?.close();
            this.socket = (await top.socketIo)(input.value + SkServer.Nsps.GROUP_JOINER, {
                reconnectionAttempts: Group.JoinerReconnectionAttempts,
            });
            this.socket.on("connect", () => {
                this.__setFormState(State.CHOOSING_GROUP);
                // Listen for group creation / deletion events.
                this.socket!.on(Group.Exist.EVENT_NAME, this.onNotifyGroupExist.bind(this));
            });
            this.socket.on("connect_error", this.onHostConnectionFailure.bind(this));
        };
    }
    private onNotifyGroupExist(response: Group.Exist.NotifyStatus): void {
        if (response === Group.Exist.RequestCreate.Response.NOPE) {
            // TODO.design what to do here
            console.info(`server rejected request to create new group \`${this.groupNameInput.value}\`.`);
        } else {
            for (const [groupName, status,] of Object.entries(response)) {
                const optElem
                    = (Array.from(this.groupNameDataList.children) as HTMLOptionElement[])
                    .find((opt: HTMLOptionElement) => opt.value === groupName)
                    || (() => {
                        const newOpt = document.createElement("option");
                        newOpt.value = groupName;
                        this.groupNameDataList.appendChild(newOpt);
                        return newOpt;
                    })();
                switch (status) {
                case Group.Exist.Status.IN_LOBBY:
                    optElem.remove(); break;
                case Group.Exist.Status.IN_GAME:
                    optElem.textContent = "In Game";
                    break;
                case Group.Exist.Status.DELETE:
                    optElem.textContent = "In Lobby";
                    break;
                }
            }
            if (response === Group.Exist.RequestCreate.Response.OKAY) {
                console.info(`server accepted request to create new group \`${this.groupNameInput.value}\`.`);
                console.log("connecting to new group...");
                this.attemptToJoinExistingGroup();
            }
        }
    }
    private onHostConnectionFailure(): void {
        this.socket = undefined;
        // TODO.impl make some visual indication.
    }

    private __initializePassphraseHandlers(): void {
        this.passphraseInput.onkeydown = (ev) => { if (ev.key === "Enter") {
            const socket = this.socket!;
            const inputNsps = SkServer.Nsps.GROUP_LOBBY_PREFIX + this.groupNameInput.value;
            if (socket.nsp === inputNsps) {
                if (socket.connected) {
                    // The client (for some reason) reselected the passphrase
                    // input, made no changes, and then pressed enter again.
                    this.nextButton.focus();
                    return;
                } else {
                    // The client is impatient and is spamming the enter button
                    // while we are trying to connect to the group.
                    return;
                }
            }
            this.passphraseInput.dispatchEvent(new Event("change"));
            // Force the change event on pressing enter, but don't
            // do it if we are currently trying to connect to a host.
        }}
        this.passphraseInput.onchange = async (ev) => {
            const input = this.passphraseInput;
            if (!input.validity.valid) return;

            const groupExists = (Array.from(this.groupNameDataList.children) as HTMLOptionElement[])
                .some((opt) => opt.value === this.groupNameInput.value);
            if (groupExists) {
                await this.attemptToJoinExistingGroup();
            } else {
                this.socket!.emit(Group.Exist.EVENT_NAME,
                    new Group.Exist.RequestCreate(
                        this.groupNameInput.value,
                        this.passphraseInput.value,
                    ),
                );
            }
        };
    }

    /**
     *
     */
    private async attemptToJoinExistingGroup(): Promise<void> {
        const url = (() => {
            const url = new window.URL(this.hostUrlInput.value);
            url.pathname = SkServer.Nsps.GROUP_LOBBY_PREFIX + this.groupNameInput.value;
            return url.toString();
        })();
        const passphrase = this.passphraseInput.value;
        if (this.state !== State.CHOOSING_GROUP) {
            throw new Error("never");
        }
        this.socket?.close();
        const top = this.toplevel;
        this.socket = (await top.socketIo)(url, {
            query: { passphrase, },
        });
        this.socket.on("connect", () => {
            this.__setFormState(State.IN_GROUP);
        });
        this.socket.on("connect_error", () => this.onGroupJoinFailure.bind(this));
    }
    private onGroupJoinFailure(): void {
        this.socket = undefined;
        // TODO.impl make some visual indication.
    }

    private get socket(): SocketIOClient.Socket | undefined {
        return this.toplevel.socket;
    }
    private set socket(newSocket: SocketIOClient.Socket | undefined) {
        this.toplevel.socket = newSocket;
    }

    /**
     * A helper for `__lazyLoad`. Does not hook up event processors.
     */
    private __initializeFormContents(): HTMLFormElement {
        const OMHC = OmHooks.Screen.Impl.GroupJoiner.Class;
        const contentWrapper = document.createElement("form");
        contentWrapper.classList.add(
            OmHooks.General.Class.INPUT_GROUP,
            OMHC.CONTENT_WRAPPER,
        );
        function createGenericTextInput(labelText: string): HTMLInputElement {
            const input = document.createElement("input");
            input.classList.add(OmHooks.General.Class.INPUT_GROUP_ITEM);
            input.type = "text";
            input.autocomplete = "off";
            input.spellcheck = false;
            // Label:
            const label = document.createElement("label");
            label.textContent = labelText;
            label.appendChild(input);
            contentWrapper.appendChild(label);
            return input;
        }{
            const hostUrl
                = (this.hostUrlInput as HTMLElement)
                = createGenericTextInput("Host URL");
            hostUrl.type = "url";
            hostUrl.classList.add(OMHC.HOST_URL);
            hostUrl.autocomplete = "on";
            const suggestedHost = GroupJoinerScreen.SUGGEST_LAN_HOST_URL(this.toplevel.webpageHostType);
            if (suggestedHost) {
                const suggestedHostOption = document.createElement("option");
                suggestedHostOption.value = suggestedHost;
                document.getElementById(OmHooks.GLOBAL_IDS.PUBLIC_GAME_HOST_URLS)!.appendChild(
                    suggestedHostOption,
                );
            }
            hostUrl.setAttribute("list", OmHooks.GLOBAL_IDS.PUBLIC_GAME_HOST_URLS);
            hostUrl.maxLength = 128;
        }{
            const nspsList
                = (this.groupNameDataList as HTMLElement)
                = document.createElement("datalist");
            nspsList.id = OmHooks.GLOBAL_IDS.CURRENT_HOST_GROUPS;
            this.baseElem.appendChild(nspsList);
        }{
            const nspsName
                = (this.groupNameInput as HTMLElement)
                = createGenericTextInput("Group Name");
            nspsName.classList.add(OMHC.GROUP_NAME);
            nspsName.pattern   = Group.Name.REGEXP.source;
            nspsName.maxLength = Group.Name.MaxLength;
            nspsName.setAttribute("list", OmHooks.GLOBAL_IDS.CURRENT_HOST_GROUPS);
        }{
            const pass
                = (this.passphraseInput as HTMLElement)
                = createGenericTextInput("Group Passphrase");
            pass.classList.add(OMHC.PASSPHRASE);
            pass.pattern   = Group.Passphrase.REGEXP.source;
            pass.maxLength = Group.Passphrase.MaxLength;
        }{
            const nextBtn
                = (this.nextButton as HTMLElement)
                = document.createElement("input");
            nextBtn.type = "submit";
            nextBtn.classList.add(
                OmHooks.General.Class.INPUT_GROUP_ITEM,
                OMHC.NEXT_BUTTON,
            );
            nextBtn.textContent = nextBtn.value = "Next";
            contentWrapper.appendChild(nextBtn);
        }
        return contentWrapper;
    }
}
export namespace GroupJoinerScreen {
    export enum State {
        CHOOSING_HOST   = "choosing-host",
        CHOOSING_GROUP  = "choosing-group",
        IN_GROUP        = "in-group",
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
                return "localhost:" + SkServer.DEFAULT_PORT;
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