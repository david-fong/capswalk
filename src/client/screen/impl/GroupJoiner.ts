import type { TopLevel } from "../../TopLevel";
import { OmHooks } from "defs/OmHooks";
import { Group } from "defs/OnlineDefs";
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
        const contentWrapper = this.__initializeFormContents();
        const top = this.toplevel;
        {
        const input = this.hostUrlInput;
        input.oninput = (ev) => this.__setFormState(State.CHOOSING_HOST);
        input.onkeydown = (ev) => {
            if (ev.key === "Enter"
            && (top.socket ? top.socket.connected : true)
            ) input.dispatchEvent(new Event("change"));
            // Force the change event on pressing enter, but don't
            // do it if we are currently trying to connect to a host.
        };
        input.onchange = async (ev) => {
            if (!input.value || !input.validity.valid) return;
            const origin = ((input.value.startsWith("http") ? "" : "http://")) + input.value;
            top.socket?.close();
            top.socket = (await top.socketIo)(origin + SnakeyServer.Nsps.GROUP_JOINER, {
                reconnectionAttempts: Group.JoinerReconnectionAttempts,
            });
            top.socket.on("connect", () => {
              this.__setFormState(State.CHOOSING_GROUP);
              // Listen for group creation / deletion events.
              top.socket!.on(Group.Exist.EVENT_NAME, (response: Group.Exist.NotifyStatus) => {
                if (response === Group.Exist.RequestCreate.Response.NOPE) {
                    // TODO.design what to do here
                    console.info(`server rejected request to create new group \`${this.groupNameInput.value}\`.`);
                } else if (response === Group.Exist.RequestCreate.Response.OKAY) {
                    console.info(`server accepted request to create new group \`${this.groupNameInput.value}\`.`);
                    this.attemptToJoinExistingGroup();
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
                        case Group.Exist.Status.IN_LOBBY: {
                        optElem.remove(); break;
                      } case Group.Exist.Status.IN_GAME: {
                        optElem.textContent = "In Game";
                        break;
                      } case Group.Exist.Status.DELETE: {
                        optElem.textContent = "In Lobby";
                        break;
                      } // AAAAAAAAA THERE'S SO MUCH NESTING!!
                    }}
                }
              });
            });
            top.socket.on("connect_error", this.onHostConnectionFailure.bind(this));
        };
        }

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

        this.passphraseInput.onkeydown = (ev) => {
            if (ev.key === "Enter"
            && (top.socket ? top.socket.connected : true)
            ) this.passphraseInput.dispatchEvent(new Event("change"));
            // Force the change event on pressing enter, but don't
            // do it if we are currently trying to connect to a host.
        }
        this.passphraseInput.onchange = async (ev) => {
            const input = this.passphraseInput;
            if (input.validity.valid) {
                const groupExists = (Array.from(this.groupNameDataList.children) as HTMLOptionElement[])
                    .some((opt) => opt.value === this.groupNameInput.value);
                if (groupExists) {
                    await this.attemptToJoinExistingGroup();
                } else {
                    this.toplevel.socket!.emit(Group.Exist.EVENT_NAME,
                        new Group.Exist.RequestCreate(
                            this.groupNameInput.value,
                            this.passphraseInput.value,
                        ),
                    );
                }
            }
        };

        this.__setFormState(State.CHOOSING_HOST);
        contentWrapper.onsubmit = (ev) => {
            this.requestGoToScreen(SkScreen.Id.GROUP_LOBBY, {});
        }
        this.baseElem.appendChild(contentWrapper);
    }

    /**
     * @override
     */
    protected async __abstractOnBeforeEnter(args: {}): Promise<void> {
        window.setTimeout(() => {
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

    private async attemptToJoinExistingGroup(): Promise<void> {
        const url = (() => {
            const input = this.hostUrlInput.value;
            const origin = (input.startsWith("http") ? "" : "http://") + input;
            const url = new window.URL(origin);
            url.pathname = SnakeyServer.Nsps.GROUP_LOBBY_PREFIX + this.groupNameInput.value;
            return url.toString();
        })();
        const passphrase = this.passphraseInput.value;
        if (this.state !== State.CHOOSING_GROUP) {
            throw new Error("never");
        }
        this.toplevel.socket?.close();
        const top = this.toplevel;
        top.socket = (await top.socketIo)(url, {
            query: { passphrase, },
        });
        top.socket.on("connect", () => {
            this.__setFormState(State.IN_GROUP);
        });
        top.socket.on("connect_error", () => this.onGroupJoinFailure.bind(this));
    }
    private onGroupJoinFailure(): void {
        // TODO.impl make some visual indication.
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
    private __initializeFormContents(): HTMLFormElement {
        const OMHC = OmHooks.Screen.Impl.GroupJoiner.Class;
        const contentWrapper = document.createElement("form");
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
            // Label:
            const hostUrlLabel = document.createElement("label");
            hostUrlLabel.textContent = "Host Url";
            hostUrlLabel.appendChild(hostUrl);
            contentWrapper.appendChild(hostUrlLabel);
        }{
            const nspsList
                = (this.groupNameDataList as HTMLDataListElement)
                = document.createElement("datalist");
            nspsList.id = OmHooks.GLOBAL_IDS.CURRENT_HOST_GROUPS;
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
            nspsName.pattern   = Group.Name.REGEXP.source;
            nspsName.maxLength = Group.Name.MaxLength;
            nspsName.setAttribute("list", OmHooks.GLOBAL_IDS.CURRENT_HOST_GROUPS);
            // Label:
            const nspsNameLabel = document.createElement("label");
            nspsNameLabel.textContent = "Group Name";
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
            pass.pattern   = Group.Passphrase.REGEXP.source;
            pass.maxLength = Group.Passphrase.MaxLength;
            // Label:
            const passLabel = document.createElement("label");
            passLabel.textContent = "Passphrase";
            passLabel.appendChild(pass);
            contentWrapper.appendChild(passLabel);
        }{
            const nextBtn
                = (this.nextButton as HTMLButtonElement)
                = document.createElement("button");
            nextBtn.classList.add(OMHC.NEXT_BUTTON);
            nextBtn.textContent = "Next";
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