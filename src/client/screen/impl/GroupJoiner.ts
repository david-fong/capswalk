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
        this.baseElem.classList.add(
            OmHooks.General.Class.CENTER_CONTENTS,
            OmHooks.Screen.Impl.GroupJoiner.Class.BASE,
        );
        const contentWrapper = this.__initializeFormContents();
        const huiSubmit = this.__initializeHostUrlHandlers();
        this.__initializeGroupNameHandlers(huiSubmit);
        this.__initializePassphraseHandlers();

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
        this.__setFormState(State.CHOOSING_HOST);
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
            this.passphraseInput.disabled = true;
            this.nextButton.disabled = false;
            this.nextButton.focus();

        } else {
            this.nextButton.disabled = true;

            if (newState === State.CHOOSING_HOST) {
                this.groupNameInput.disabled    = true;
                this.groupNameInput.value       = "";
                this.groupNameDataList.replaceWith(this.groupNameDataList.cloneNode());
                this.passphraseInput.disabled   = true;
                this.passphraseInput.value      = "";
                this.hostUrlInput.focus();
                ;
            } else if (newState === State.CHOOSING_GROUP) {
                this.groupNameInput.disabled    = false;
                this.passphraseInput.disabled   = false;
                this.groupNameInput.focus();
            }
        }
        this.#state = newState;
    }

    /**
     *
     */
    private __initializeHostUrlHandlers(): () => Promise<void> {
        const top = this.toplevel;
        const input = this.hostUrlInput;
        const submitInput = async () => {
            // Minor cleaning: default the protocol and only use the origin:
            if (!input.value.startsWith(SkServer.PROTOCOL)) {
                input.value = new URL(SkServer.PROTOCOL + input.value).origin;
            }
            // Short-circuit on invalid input:
            if (!input.value || !input.validity.valid) return;

            // Short-circuit when no change has occurred:
            const targetSocketUri = new URL(input.value + SkServer.Nsps.GROUP_JOINER);
            if (this.socket
            && this.socket.nsp === SkServer.Nsps.GROUP_JOINER
            && this.socket.io.opts.hostname === targetSocketUri.hostname
            ) {
                if (this.socket!.connected) {
                    this.__setFormState(State.CHOOSING_GROUP);
                    this.groupNameInput.focus(); // No changes have occurred.
                    return;
                } else {
                    return; // Impatient client is spamming.
                }
            }
            this.socket?.close();
            this.socket = (await top.socketIo)(targetSocketUri.toString(), {
                reconnectionAttempts: Group.JoinerReconnectionAttempts,
            });
            this.socket.on("connect", () => {
                this.__setFormState(State.CHOOSING_GROUP);
                // Listen for group creation / deletion events.
                this.socket!.on(Group.Exist.EVENT_NAME, this.onNotifyGroupExist.bind(this));
            });
            this.socket.on("connect_error", (error: object) => {
                this.socket = undefined;
                this.toplevel.toast("Unable to connected to the specified server.");
            });
            this.socket.on("disconnect", (reason: string) => {
                if (reason === "io server disconnect") {
                    this.socket = undefined;
                    this.__setFormState(State.CHOOSING_HOST);
                    input.value = "";
                    top.toast("The server disconnected you from the group joiner.");
                }
            });
        };
        // Link handler to events:
        input.oninput = (ev) => this.__setFormState(State.CHOOSING_HOST);
        input.onkeydown = (ev) => { if (ev.key === "Enter") {
            submitInput();
        }};
        input.onpaste = (ev) => {
            window.setTimeout(() => submitInput(), 0);
        };
        input.onchange = () => {
            submitInput();
        };
        return submitInput;
    }
    /**
     *
     */
    private onNotifyGroupExist(response: Group.Exist.NotifyStatus): void {
        if (response === Group.Exist.RequestCreate.Response.NOPE) {
            this.toplevel.toast(`The server rejected your request to`
            + ` create a new group \"${this.groupNameInput.value}\".`);
            return;
        }
        const dataList = this.groupNameDataList;
        const dataListArr = Array.from(dataList.children) as HTMLOptionElement[];
        for (const [groupName, status,] of Object.entries(response)) {
            const optElem
                = dataListArr.find((opt: HTMLOptionElement) => opt.value === groupName)
                || (() => {
                    // If we didn't know about this group yet, create a new
                    // option for it (Insert into list in alphabetical order):
                    const newOpt = document.createElement("option");
                    newOpt.value = groupName;
                    for (const otherOpt of dataListArr) {
                        if (newOpt.value.localeCompare(otherOpt.value) < 0) {
                            dataList.insertBefore(newOpt, otherOpt);
                            break;
                        }
                    }
                    if (!newOpt.parentElement) {
                        dataList.appendChild(newOpt);
                    }
                    return newOpt;
                })();
            switch (status) {
            case Group.Exist.Status.IN_LOBBY:
                optElem.remove();
                break;
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

    private __initializeGroupNameHandlers(huiSubmit: () => Promise<void>): void {
        const input = this.groupNameInput;
        const submitInput = () => {
            if (!input.value || !input.validity.valid) return;
            if (this.state === State.IN_GROUP) {
                this.nextButton.focus();
            } else {
                this.passphraseInput.focus();
            }
        }
        this.groupNameInput.oninput = async (ev) => {
            if (this.state === State.IN_GROUP) {
                await huiSubmit();
                // ^This will take us back to the state `CHOOSING_GROUP`.
            }
            this.passphraseInput.value = "";
        }
        input.onkeydown = (ev) => { if (ev.key === "Enter") {
            submitInput();
        }};
        input.onchange = (ev) => {
            submitInput();
        };
    }

    /**
     *
     */
    private __initializePassphraseHandlers(): void {
        const submitInput = async () => {
            if (!this.passphraseInput.validity.valid) return;
            // Short-circuit when no change has occurred:
            if (this.socket!.nsp === SkServer.Nsps.GROUP_LOBBY_PREFIX + this.groupNameInput.value) {
                if (this.socket!.connected) {
                    this.__setFormState(State.IN_GROUP);
                    this.nextButton.focus(); // No changes have occurred.
                    return;
                } else {
                    return; // Impatient client is spamming.
                }
            }

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
        this.passphraseInput.onkeydown = (ev) => { if (ev.key === "Enter") {
            submitInput();
        }};
    }

    /**
     *
     */
    private async attemptToJoinExistingGroup(): Promise<void> {
        const url = (() => {
            const url = new URL(this.hostUrlInput.value);
            url.pathname = SkServer.Nsps.GROUP_LOBBY_PREFIX + this.groupNameInput.value;
            return url.toString();
        })();
        this.socket?.close();
        const top = this.toplevel;
        this.socket = (await top.socketIo)(url, {
            query: { passphrase: this.passphraseInput.value, },
        });
        this.socket.on("connect", () => {
            this.__setFormState(State.IN_GROUP);
        });
        this.socket.on("connect_error", (error: object) => {
            this.socket = undefined;
            top.toast("Unable to connect to the specified group.");
        });
        this.socket.on("disconnect", (reason: string) => {
            if (reason === "io server disconnect") {
                this.socket = undefined;
                top.toast("The server disconnected you from your group.");
            }
        });
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
            const suggestedHostDesc = GroupJoinerScreen.SUGGEST_HOST(this.toplevel.webpageHostType);
            if (suggestedHostDesc) {
                const suggestOpt = document.createElement("option");
                suggestOpt.value = suggestedHostDesc.value;
                suggestOpt.textContent = suggestedHostDesc.description;
                document.getElementById(OmHooks.GLOBAL_IDS.PUBLIC_GAME_HOST_URLS)!
                    .insertAdjacentElement("afterbegin", suggestOpt);
            }
            hostUrl.setAttribute("list", OmHooks.GLOBAL_IDS.PUBLIC_GAME_HOST_URLS);
            hostUrl.maxLength = 128;
        }{
            const nspsName
                = (this.groupNameInput as HTMLElement)
                = createGenericTextInput("Group Name");
            nspsName.classList.add(OMHC.GROUP_NAME);
            nspsName.pattern   = Group.Name.REGEXP.source;
            nspsName.maxLength = Group.Name.MaxLength;
            const nspsList
                = (this.groupNameDataList as HTMLElement)
                = document.createElement("datalist");
            nspsList.id = OmHooks.GLOBAL_IDS.CURRENT_HOST_GROUPS;
            this.baseElem.appendChild(nspsList);
            nspsName.setAttribute("list", nspsList.id);
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
    export function SUGGEST_HOST(webpageHostType: TopLevel.WebpageHostType): ({
        readonly value: string;
        readonly description: string;
    } | undefined) {
        switch (webpageHostType) {
            case "github":
                // Use case: production. Load page resources from GitHub
                // Pages to reduce load on the game server, which is on
                // on the LAN. Only use the server for game management.
                return undefined;
            case "filesystem":
                // Use case: development. Load page resources directly from
                // the local filesystem. Server only used as a game manager.
                // In this case, suggest connecting to `localhost`.
                return {
                    value: "localhost:" + SkServer.DEFAULT_PORT,
                    description: "dev shortcut :)",
                };
            case "lan-server":
                // Use case: production. Page resources are probably being
                // served by the LAN server already. Suggest connecting
                // Socket.IO to that same host. Just give origin (exclude
                // the URI's path, since Socket.IO interprets the path as
                // a namespace specifier).
                return {
                    value: window.location.origin,
                    description: "this page's server",
                };
            default:
                return undefined;
        }
    }
}
const State = GroupJoinerScreen.State;
type  State = GroupJoinerScreen.State;
Object.freeze(GroupJoinerScreen);
Object.freeze(GroupJoinerScreen.prototype);