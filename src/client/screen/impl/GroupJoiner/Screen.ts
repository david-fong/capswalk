import type { Socket } from "socket.io-client";
import type { TopLevel } from "client/TopLevel";
import { Group } from "defs/OnlineDefs";
import { SkServer } from "defs/OnlineDefs";

import { JsUtils, OmHooks, SkScreen, StorageHooks } from "../../SkScreen";
type SID = SkScreen.Id.GROUP_JOINER;
import CSS from "./style.m.css";


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
	 * Throws an error if called before this screen is lazy-loaded.
	 */
	public get loginInfo(): Readonly<{ name?: Group.Name, passphrase?: Group.Passphrase }> {
		if (this.in === undefined) {
			throw new Error("never"); // Should never be called before entrance.
		}
		return Object.freeze({
			name: this.in.groupName.value,
			passphrase: this.in.passphrase.value,
		});
	}

	/**
	 * @override
	 */
	protected _lazyLoad(): void {
		this.baseElem.classList.add(
			OmHooks.General.Class.CENTER_CONTENTS,
			CSS["this"],
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
		};
		const contentWrapperSubmit = (): void => {
			// ev.preventDefault(); // Don't perform any form action
			// No validation needed. The next button is only enabled if inputs are valid.
			this.requestGoToScreen(SkScreen.Id.GROUP_LOBBY, {});
		};
		this._setFormState(State.CHOOSING_HOST);
		this.baseElem.appendChild(contentWrapper);
	}

	/**
	 * @override
	 */
	public getRecommendedFocusElem(): HTMLElement {
		return (this.groupSocket !== undefined) ? this.in.groupName : this.in.hostUrl;
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
				throw new Error("never"); // Illegal state transition.
			}
			this.in.passphrase.disabled = true;
			this.nav.next.disabled = false;
			this.nav.next.focus();

		} else {
			this.nav.next.disabled = true;
			this.in.passphrase.value = "";

			if (newState === State.CHOOSING_HOST) {
				this.in.groupName.disabled    = true;
				this.in.groupName.value       = "";
				// Fun fact on an alternative for clearing children: https://stackoverflow.com/a/22966637/11107541
				this.groupNameDataList.textContent = "";
				this.in.passphrase.disabled   = true;
				this.in.hostUrl.focus();
				;
			} else if (newState === State.CHOOSING_GROUP) {
				this.in.groupName.disabled    = false;
				this.in.passphrase.disabled   = false;
				this.#clientIsGroupHost       = false;
				this.in.groupName.focus();
			}
		}
		this.#state = newState;
	}

	/**
	 */
	private _initializeHostUrlHandlers(): () => Promise<void> {
		const top = this.top;
		const input = this.in.hostUrl;
		const submitInput = async (): Promise<void> => {
			// Short-circuit on invalid input:
			if (!input.value || !input.validity.valid) return;

			// Minor cleaning: default the protocol and only use the origin:
			// if (!input.value.startsWith(SkServer.PROTOCOL)) {
			//     input.value = new window.URL(SkServer.PROTOCOL + input.value).origin;
			// }

			// Short-circuit when no change has occurred:
			const gameServerUrl = new window.URL(input.value);
			if (this.groupSocket?.io!["opts"].hostname === gameServerUrl.hostname) {
				if (this.groupSocket!.connected) {
					this._setFormState(State.CHOOSING_GROUP);
				} else {
					// Impatient client is spamming.
				}
				return;
			}
			this.joinerSocket?.disconnect();
			const sock = await this.top.sockets.joinerSocketConnect({
				serverUrl: gameServerUrl,
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
		input.onkeydown = (ev) => { if (ev.isTrusted && ev.key === "Enter") {
			submitInput();
		}};
		input.onpaste = (ev) => {
			if (ev.isTrusted) window.setTimeout(() => submitInput(), 0);
		};
		input.onchange = (ev) => {
			if (ev.isTrusted) submitInput();
		};
		return submitInput;
	}
	/**
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
			const newOpt = JsUtils.mkEl("option", [], { value: groupName });
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
		Object.entries(response).forEach(([groupName, status]) => {
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

	/**
	 */
	private _initializeGroupNameHandlers(hostUrlInputSubmit: () => Promise<void>): void {
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
			if (!ev.isTrusted) return;
			if (this.state === State.IN_GROUP) {
				await hostUrlInputSubmit();
				// ^This will take us back to the state `CHOOSING_GROUP`.
			}
			this.in.passphrase.value = "";
			this.#clientIsGroupHost = false;
		};
		input.onkeydown = (ev) => {
			if (ev.isTrusted && ev.key === "Enter") submitInput();
		};
		input.onchange = (ev) => {
			if (ev.isTrusted) submitInput();
		};
	}

	/**
	 */
	private _initializePassphraseHandlers(): void {
		const submitInput = async (): Promise<void> => {
			if (!this.in.passphrase.validity.valid) return;
			// Short-circuit when no change has occurred:
			if (this.groupSocket !== undefined
			 && this.groupSocket["nsp"] === SkServer.Nsps.GROUP_LOBBY_PREFIX + this.in.groupName.value
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
				this._attemptToJoinExistingGroup();
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
		this.in.passphrase.onkeydown = (ev) => { if (ev.isTrusted && ev.key === "Enter") {
			submitInput();
		}};
	}

	/**
	 * Automatically disconnects from the current group (if it exists).
	 */
	private _attemptToJoinExistingGroup(): void {
		this.groupSocket?.disconnect();
		const top = this.top;
		const userInfo = StorageHooks.getLastUserInfo();
		const sock = this.top.sockets.groupSocketConnect(
			this.in.groupName.value, {
				passphrase: this.in.passphrase.value,
				userInfo,
			},
		); sock
		.on("connect", () => {
			this._setFormState(State.IN_GROUP);
		})
		.on("connect_error", (error: object) => {
			this._setFormState(State.CHOOSING_GROUP);
			top.toast("Unable to connect to the specified group.");
		})
		.on("disconnect", (reason: string) => {
			this._setFormState(State.CHOOSING_GROUP);
			if (reason === "io server disconnect") {
				top.toast("The server disconnected you from your group.");
				if (this.top.currentScreen !== this) {
					this.requestGoToScreen(SkScreen.Id.GROUP_JOINER, {});
				} else {
					this.in.passphrase.focus();
				}
			}
		});
	}

	private get joinerSocket(): Socket | undefined {
		return this.top.sockets.joinerSocket;
	}
	private get groupSocket(): Socket | undefined {
		return this.top.sockets.groupSocket;
	}

	/**
	 * A helper for `_lazyLoad`. Does not hook up event processors.
	 */
	private _initializeFormContents(): HTMLElement {
		// @ts-expect-error : RO=
		this.in = {};
		const contentWrapper = JsUtils.mkEl("div"/*"form"*/, [
			OmHooks.General.Class.INPUT_GROUP,
			CSS["content-wrapper"],
		], {
			// contentWrapper.method = "POST"; // Not actually used, since the default onsubmit behaviour is prevented.
		});

		this.nav.prev.classList.add(OmHooks.General.Class.INPUT_GROUP_ITEM);
		contentWrapper.appendChild(this.nav.prev);

		function createGenericTextInput(labelText: string, classStr: string): HTMLInputElement {
			const input = JsUtils.mkEl("input", [OmHooks.General.Class.INPUT_GROUP_ITEM, classStr], {
				type: "text",
				autocomplete: "off",
				spellcheck: false,
			});
			// Label:
			const label = JsUtils.mkEl("label", [], { textContent: labelText });
			label.appendChild(input);
			contentWrapper.appendChild(label);
			return input;
		}{
			// @ts-expect-error : RO=
			const hostUrl = this.in.hostUrl
			= Object.assign(createGenericTextInput("Host URL", CSS["host-url"]), <Partial<HTMLInputElement>>{
				type: "url",
				maxLength: 128,
				autocomplete: "on",
				required: true,
			});
			hostUrl.setAttribute("list", OmHooks.GLOBAL_IDS.PUBLIC_GAME_HOST_URLS);
			const suggestedHostDesc = GroupJoinerScreen.SUGGEST_HOST(this.top.webpageHostType);
			if (suggestedHostDesc) {
				const suggestOpt = JsUtils.mkEl("option", [], {
					value: suggestedHostDesc.value,
					textContent: suggestedHostDesc.description,
				});
				const datalist = document.getElementById(OmHooks.GLOBAL_IDS.PUBLIC_GAME_HOST_URLS)!;
				datalist.insertAdjacentElement("afterbegin", suggestOpt);
				hostUrl.value = suggestOpt.value;
			}
		}{
			// @ts-expect-error : RO=
			const nspsName = this.in.groupName
			= Object.assign(createGenericTextInput("Group Name", CSS["group-name"]),
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
				= JsUtils.mkEl("datalist", [], { id: OmHooks.GLOBAL_IDS.CURRENT_HOST_GROUPS});
			this.baseElem.appendChild(nspsList);
			nspsName.setAttribute("list", nspsList.id);
		}{
			const pass
				// @ts-expect-error : RO=
				= this.in.passphrase
				= createGenericTextInput("Group Passphrase", CSS["passphrase"]);
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