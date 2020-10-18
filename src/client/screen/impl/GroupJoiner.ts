import type { TopLevel } from "../../TopLevel";
import { Group } from "defs/OnlineDefs";
import { SkServer } from "defs/OnlineDefs";

import { JsUtils, OmHooks, SkScreen, StorageHooks } from "../SkScreen";
type SID = SkScreen.Id.GROUP_JOINER;

/**
 * This screen is like a form for joining a session on a remote host.
 */
export class GroupJoinerScreen extends SkScreen<SID> {

    #state: GroupJoinerScreen.State;

    private readonly in: Readonly<{
        hostUrl:    HTMLInputElement;
        groupName:  HTMLInputElement;
        passphrase: HTMLInputElement;
    }>;
    private readonly groupNameDataList: HTMLDataListElement;

    #clientIsGroupHost: boolean = false;
    public get clientIsGroupHost(): boolean {
        return this.#clientIsGroupHost;
    }

    /**
     * @override
     */
    protected _lazyLoad(): void {
        this.baseElem.classList.add(
            OmHooks.General.Class.CENTER_CONTENTS,
            OmHooks.Screen.Impl.GroupJoiner.Class.BASE,
        );
        const contentWrapper = this._initializeFormContents();
        const huiSubmit = this._initializeHostUrlHandlers();
        this._initializeGroupNameHandlers(huiSubmit);
        this._initializePassphraseHandlers();

        // Note: externalized from `_initializeFormContents` for visibility.
        this.nav.next.onclick = (ev) => {
            // Using a plain button instead of <input type="submit"> is
            // better here since we don't want any magical form behaviour.
            contentWrapperSubmit();
        }
        const contentWrapperSubmit = () => {
            // ev.preventDefault(); // Don't try sending anything to the server.
            // No validation needed. The next button is only enabled if inputs are valid.
            this.requestGoToScreen(SkScreen.Id.GROUP_LOBBY, {});
        };
        this._setFormState(State.CHOOSING_HOST);
        this.baseElem.appendChild(contentWrapper);
    }

    /**
     * @override
     */
    protected async _abstractOnBeforeEnter(navDir: SkScreen.NavDir, args: SkScreen.EntranceArgs[SID]): Promise<void> {
        window.setTimeout(() => {
            if (this.groupSocket) {
                // Default to switching groups under the same host:
                this.in.groupName.focus();
            } else {
                // We aren't connected to a host, or aren't yet in a group:
                this.in.hostUrl.focus();
            }
        }, 100); // <-- An arbitrary short period of time. See super doc.
        return;
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
    private _setFormState(newState: State): void {
        if (this.state === newState) return;

        if (newState === State.IN_GROUP) {
            if (this.state !== State.CHOOSING_GROUP) {
                throw "never"; // Illegal state transition.
            }
            this.in.passphrase.disabled = true;
            this.nav.next.disabled = false;
            this.nav.next.focus();

        } else {
            this.nav.next.disabled = true;

            if (newState === State.CHOOSING_HOST) {
                this.in.groupName.disabled    = true;
                this.in.groupName.value       = "";
                // Fun fact on an alternative for clearing children: https://stackoverflow.com/a/22966637/11107541
                this.groupNameDataList.innerText = "";
                this.in.passphrase.disabled   = true;
                this.in.passphrase.value      = "";
                this.in.hostUrl.focus();
                ;
            } else if (newState === State.CHOOSING_GROUP) {
                this.in.groupName.disabled    = false;
                this.in.passphrase.disabled   = false;
                this.in.groupName.focus();
            }
        }
        this.#state = newState;
    }

    /**
     *
     */
    private _initializeHostUrlHandlers(): () => Promise<void> {
        const top = this.top;
        const input = this.in.hostUrl;
        const submitInput = async (): Promise<void> => {
            // Short-circuit on invalid input:
            if (!input.value || !input.validity.valid) return;

            // Minor cleaning: default the protocol and only use the origin:
            if (!input.value.startsWith(SkServer.PROTOCOL)) {
                input.value = new window.URL(SkServer.PROTOCOL + input.value).origin;
            }

            // Short-circuit when no change has occurred:
            const targetSocketUri = new window.URL(input.value + SkServer.Nsps.GROUP_JOINER);
            if (this.groupSocket?.io.opts.hostname === targetSocketUri.hostname) {
                if (this.groupSocket!.connected) {
                    this._setFormState(State.CHOOSING_GROUP);
                    this.in.groupName.focus(); // No changes have occurred.
                } else {
                    // Impatient client is spamming.
                }
                return;
            }
            this.joinerSocket?.close();
            const sock = await this.top.sockets.setJoinerSocket(targetSocketUri.toString(), {
                reconnectionAttempts: Group.JoinerReconnectionAttempts,
            }); sock
            .on("connect", () => {
                this._setFormState(State.CHOOSING_GROUP);
                // Listen for group creation / deletion events.
                sock.on(Group.Exist.EVENT_NAME, this._onNotifyGroupExist.bind(this));
            })
            .on("connect_error", (error: object) => {
                this.top.toast("Unable to connected to the specified server.");
            })
            .on("disconnect", (reason: string) => {
                if (reason === "io server disconnect") {
                    this._setFormState(State.CHOOSING_HOST);
                    input.value = "";
                    top.toast("The server disconnected you from the group joiner.");
                }
            });
        };
        // Link handler to events:
        input.oninput = (ev) => this._setFormState(State.CHOOSING_HOST);
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
    private _onNotifyGroupExist(response: Group.Exist.NotifyStatus): void {
        if (response === Group.Exist.RequestCreate.Response.NOPE) {
            this.top.toast(`The server rejected your request to`
            + ` create a new group \"${this.in.groupName.value}\".`);
            return;
        }
        if (response === Group.Exist.RequestCreate.Response.OKAY) {
            this.top.toast(`server accepted request to create new group \"${this.in.groupName.value}\".`);
            this.top.toast("connecting to new group...");
            this._attemptToJoinExistingGroup();
            return;
        }
        const makeOption = (groupName: Group.Name): HTMLOptionElement => {
            // If we didn't know about this group yet, create a new
            // option for it (Insert into list in alphabetical order):
            const newOpt = document.createElement("option");
            newOpt.value = groupName;
            //console.log(newOpt.value);
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
        };
        const dataList = this.groupNameDataList;
        const dataListArr = Array.from(dataList.children) as HTMLOptionElement[];
        Object.entries(response).forEach(([groupName, status,]) => {
            const optElem
                = dataListArr.find((opt: HTMLOptionElement) => opt.value === groupName)
                || makeOption(groupName);
            switch (status) {
            case Group.Exist.Status.IN_LOBBY:
                optElem.textContent = "In Lobby";
                break;
            case Group.Exist.Status.IN_GAME:
                optElem.textContent = "In Game";
                break;
            case Group.Exist.Status.DELETE:
                optElem.remove();
                break;
            }
        });
    }

    private _initializeGroupNameHandlers(huiSubmit: () => Promise<void>): void {
        const input = this.in.groupName;
        const submitInput = (): void => {
            if (!input.value || !input.validity.valid) return;
            if (this.state === State.IN_GROUP) {
                this.nav.next.focus();
            } else {
                this.in.passphrase.focus();
            }
        };
        this.in.groupName.oninput = async (ev) => {
            if (this.state === State.IN_GROUP) {
                await huiSubmit();
                // ^This will take us back to the state `CHOOSING_GROUP`.
            }
            this.in.passphrase.value = "";
            this.#clientIsGroupHost = false; // <-- Not necessary. Just feels nice to do.
        };
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
    private _initializePassphraseHandlers(): void {
        const submitInput = async (): Promise<void> => {
            if (!this.in.passphrase.validity.valid) return;
            // Short-circuit when no change has occurred:
            if (this.groupSocket !== undefined
             && this.groupSocket.nsp === SkServer.Nsps.GROUP_LOBBY_PREFIX + this.in.groupName.value
            ) {
                if (this.groupSocket!.connected) {
                    this._setFormState(State.IN_GROUP);
                    this.nav.next.focus(); // No changes have occurred.
                    return;
                } else {
                    return; // Impatient client is spamming.
                }
            }

            const groupExists = (Array.from(this.groupNameDataList.children) as HTMLOptionElement[])
                .some((opt) => opt.value === this.in.groupName.value);
            if (groupExists) {
                this.#clientIsGroupHost = false;
                await this._attemptToJoinExistingGroup();
            } else {
                this.#clientIsGroupHost = true;
                this.joinerSocket!.emit(Group.Exist.EVENT_NAME,
                    new Group.Exist.RequestCreate(
                        this.in.groupName.value,
                        this.in.passphrase.value,
                    ),
                );
            }
        };
        this.in.passphrase.onkeydown = (ev) => { if (ev.key === "Enter") {
            submitInput();
        }};
    }

    /**
     *
     */
    private async _attemptToJoinExistingGroup(): Promise<void> {
        const url = (() => {
            const url = new window.URL(this.in.hostUrl.value);
            url.pathname = SkServer.Nsps.GROUP_LOBBY_PREFIX + this.in.groupName.value;
            return url.toString();
        })();
        this.groupSocket?.close();
        const top = this.top;
        const userInfo = StorageHooks.getLastUserInfo();
        const sock = await this.top.sockets.setGroupSocket(url, {
            query: {
                passphrase: this.in.passphrase.value,
                userInfo,
            },
        });
        sock.on("connect", () => {
            this._setFormState(State.IN_GROUP);
        }).on("connect_error", (error: object) => {
            top.toast("Unable to connect to the specified group.");
        }).on("disconnect", (reason: string) => {
            if (reason === "io server disconnect") {
                top.toast("The server disconnected you from your group.");
                this.requestGoToScreen(SkScreen.Id.GROUP_JOINER, {}, SkScreen.NavDir.BACKWARD);
            }
        });
    }

    private get joinerSocket(): SocketIOClient.Socket | undefined {
        return this.top.sockets.joinerSocket;
    }
    private get groupSocket(): SocketIOClient.Socket | undefined {
        return this.top.sockets.groupSocket;
    }

    /**
     * A helper for `_lazyLoad`. Does not hook up event processors.
     */
    private _initializeFormContents(): HTMLElement {
        // @ts-expect-error : RO=
        this.in = {};
        const OMHC = OmHooks.Screen.Impl.GroupJoiner.Class;
        const contentWrapper = document.createElement("div"/*"form"*/);
        // contentWrapper.method = "POST"; // Not actually used, since the default onsubmit behaviour is prevented.
        contentWrapper.classList.add(
            OmHooks.General.Class.INPUT_GROUP,
            OMHC.CONTENT_WRAPPER,
        );
        this.nav.prev.classList.add(OmHooks.General.Class.INPUT_GROUP_ITEM);
        contentWrapper.appendChild(this.nav.prev);

        function createGenericTextInput(labelText: string, classStr: string): HTMLInputElement {
            const input = document.createElement("input");
            input.classList.add(OmHooks.General.Class.INPUT_GROUP_ITEM, classStr);
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
            // @ts-expect-error : RO=
            const hostUrl = this.in.hostUrl
            = Object.assign(createGenericTextInput("Host URL", OMHC.HOST_URL), <Partial<HTMLInputElement>>{
                type: "url",
                maxLength: 128,
                autocomplete: "on",
                required: true,
            });
            const suggestedHostDesc = GroupJoinerScreen.SUGGEST_HOST(this.top.webpageHostType);
            if (suggestedHostDesc) {
                const suggestOpt = document.createElement("option");
                suggestOpt.value = suggestedHostDesc.value;
                suggestOpt.textContent = suggestedHostDesc.description;
                document.getElementById(OmHooks.GLOBAL_IDS.PUBLIC_GAME_HOST_URLS)!
                    .insertAdjacentElement("afterbegin", suggestOpt);
            }
            hostUrl.setAttribute("list", OmHooks.GLOBAL_IDS.PUBLIC_GAME_HOST_URLS);
        }{
            // @ts-expect-error : RO=
            const nspsName = this.in.groupName
            = Object.assign(createGenericTextInput("Group Name", OMHC.GROUP_NAME),
            <Partial<HTMLInputElement>>{
                pattern: Group.Name.REGEXP.source,
                minLength: 1,
                maxLength: Group.Name.MaxLength,
                autocomplete: "on",
                required: true,
            });
            const nspsList
                // @ts-expect-error : RO=
                = this.groupNameDataList
                = document.createElement("datalist");
            nspsList.id = OmHooks.GLOBAL_IDS.CURRENT_HOST_GROUPS;
            this.baseElem.appendChild(nspsList);
            nspsName.setAttribute("list", nspsList.id);
        }{
            const pass
                // @ts-expect-error : RO=
                = this.in.passphrase
                = createGenericTextInput("Group Passphrase", OMHC.PASSPHRASE);
            pass.pattern   = Group.Passphrase.REGEXP.source;
            pass.maxLength = Group.Passphrase.MaxLength;
        }{
            this.nav.next.classList.add(OmHooks.General.Class.INPUT_GROUP_ITEM);
            contentWrapper.appendChild(this.nav.next);
        }
        JsUtils.propNoWrite(this as GroupJoinerScreen, ["in", "groupNameDataList"]);
        Object.freeze(this.in);
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
            case "sk-server":
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