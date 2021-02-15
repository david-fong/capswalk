import { TopLevel } from "client/TopLevel";
import { Group, GroupEv } from "defs/OnlineDefs";
import { SkServer } from "defs/OnlineDefs";

import { JsUtils, OmHooks, BaseScreen, StorageHooks } from "../../BaseScreen";
type SID = BaseScreen.Id.GROUP_JOINER;
import style from "./style.m.css";

/** */
export class GroupJoinerScreen extends BaseScreen<SID> {

	#state: GroupJoinerScreen.State;
	private readonly in: Readonly<{
		hostUrl:    HTMLInputElement;
		groupName:  HTMLInputElement;
		passphrase: HTMLInputElement;
	}>;
	private readonly groupNameDataList= JsUtils.html("datalist", [], { id: OmHooks.GLOBAL_IDS.CURRENT_HOST_GROUPS});

	#isHost: boolean = false;
	public get isHost(): boolean {
		return this.#isHost;
	}
	/** Throws an error if called before this screen is lazy-loaded. */
	public get loginInfo(): Readonly<{ name?: Group.Name, passphrase?: Group.Passphrase }> {
		return Object.freeze({
			name: this.in.groupName.value,
			passphrase: this.in.passphrase.value,
		});
	}
	private get socket(): WebSocket {
		return this.top.socket!;
	}

	/** @override */
	protected _lazyLoad(): void {
		this.baseElem.classList.add(
			OmHooks.General.Class.CENTER_CONTENTS,
			style["this"],
		);
		const contentWrapper = this._initializeFormContents();
		const huiSubmit = this._initializeHostUrlHandlers();
		this._initializeGroupNameHandlers(huiSubmit);
		this._initializePassphraseHandlers();
		Object.freeze(this); //🧊

		// Note: externalized from `_initializeFormContents` for visibility.
		this.nav.next.onclick = (ev) => {
			// No validation needed. The next button is only enabled if inputs are valid.
			this.requestGoToScreen(BaseScreen.Id.GROUP_LOBBY, {});
		};
		this._setFormState(State.CHOOSING_HOST);
		this.baseElem.appendChild(contentWrapper);
	}

	/** @override */
	public getRecommendedFocusElem(): HTMLElement {
		return (this.socket === undefined) ? this.in.hostUrl : this.in.groupName;
	}

	public get state(): State {
		return this.#state;
	}
	/** Doesn't touch sockets. */
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
				this.in.groupName.disabled  = true;
				this.in.groupName.value     = "";
				// Fun fact on an alternative for clearing children: https://stackoverflow.com/a/22966637/11107541
				this.groupNameDataList.textContent = "";
				this.in.passphrase.disabled = true;
				this.in.hostUrl.focus();

			} else if (newState === State.CHOOSING_GROUP) {
				this.in.groupName.disabled  = false;
				this.in.passphrase.disabled = false;
				this.#isHost     = false;
				this.in.groupName.focus();
			}
		}
		this.#state = newState;
	}

	/** */
	private _initializeHostUrlHandlers(): VoidFunction {
		const top = this.top;
		const input = this.in.hostUrl;
		const submitInput = (): void => {
			if (!input.value || !input.validity.valid) return; //⚡

			// Minor cleaning: default the protocol and only use the origin:
			// if (!input.value.startsWith(SkServer.PROTOCOL)) {
			//     input.value = new window.URL(SkServer.PROTOCOL + input.value).origin;
			// }

			// Short-circuit when no change has occurred:
			const gameServerUrl = new window.URL(input.value);
			if (this.socket.url.hostname === gameServerUrl.hostname) {
				if (this.groupSocket!.connected) {
					this._setFormState(State.CHOOSING_GROUP);
				} else {
					// Impatient client is spamming.
				}
				return;
			}
			socket
			.on("connect", () => {
				this._setFormState(State.CHOOSING_GROUP);
				// Listen for group creation / deletion events.
				socket.addEventListener("message", Group.Exist.EVENT_NAME, this._onNotifyGroupExist.bind(this));
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
	/** */
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
			const newOpt = JsUtils.html("option", [], { value: groupName });
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
		Object.freeze(Object.entries(response)).forEach(([groupName, status]) => {
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

	/** */
	private _initializeGroupNameHandlers(hostUrlInputSubmit: VoidFunction): void {
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
				hostUrlInputSubmit();
				// ^This will take us back to the state `CHOOSING_GROUP`.
			}
			this.in.passphrase.value = "";
			this.#isHost = false;
		};
		input.onkeydown = (ev) => {
			if (ev.isTrusted && ev.key === "Enter") submitInput();
		};
		input.onchange = (ev) => {
			if (ev.isTrusted) submitInput();
		};
	}

	/** */
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
				this.#isHost = false;
				this._attemptToJoinExistingGroup();
			} else {
				this.#isHost = true;
				this.socket.send(JSON.stringify([
					Group.Exist.EVENT_NAME,
					new Group.Exist.RequestCreate(
						this.in.groupName.value,
						this.in.passphrase.value,
					),
				]));
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
		const top = this.top;
		const userInfo = StorageHooks.getLastUserInfo();
		const sock = this.top.socket!.send(JSON.stringify([GroupEv.TRY_JOIN, {
			groupName: this.in.groupName.value,
			passphrase: this.in.passphrase.value,
			userInfo,
		}])); sock
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
					this.requestGoToScreen(BaseScreen.Id.GROUP_JOINER, {});
				} else {
					this.in.passphrase.focus();
				}
			}
		});
	}

	/** A helper for `_lazyLoad`. Does not hook up event processors. */
	private _initializeFormContents(): HTMLElement {
		function _mkInput(labelText: string, classStr: string): HTMLInputElement {
			const input = JsUtils.html("input", [OmHooks.General.Class.INPUT_GROUP_ITEM, classStr], {
				type: "text",
				autocomplete: "off",
				spellcheck: false,
			});
			// Label:
			const label = JsUtils.html("label", [], { textContent: labelText });
			label.appendChild(input);
			contentWrapper.appendChild(label);
			return input;
		}
		// @ts-expect-error : RO=
		this.in = Object.freeze({
			"hostUrl": Object.assign(_mkInput("Host URL", style["host-url"]), <Partial<HTMLInputElement>>{
				type: "url",
				maxLength: 128,
				autocomplete: "on",
				required: true,
			}),
			"groupName": Object.assign(_mkInput("Group Name", style["group-name"]), <Partial<HTMLInputElement>>{
				pattern: Group.Name.REGEXP.source,
				minLength: 1,
				maxLength: Group.Name.MaxLength,
				autocomplete: "on",
				required: true,
				list: this.groupNameDataList,
			}),
			"passphrase": Object.assign(_mkInput("Group Passphrase", style["passphrase"]), <Partial<HTMLInputElement>>{
				pattern: Group.Passphrase.REGEXP.source,
				maxLength: Group.Passphrase.MaxLength,
			}),
		});
		const contentWrapper = JsUtils.html("div"/*"form"*/, [
			OmHooks.General.Class.INPUT_GROUP,
			style["content-wrapper"],
		], {
			// contentWrapper.method = "POST"; // Not actually used, since the default onsubmit behaviour is prevented.
		});

		this.nav.prev.classList.add(OmHooks.General.Class.INPUT_GROUP_ITEM);
		contentWrapper.appendChild(this.nav.prev);
		{
			const hostUrl = this.in.hostUrl;
			hostUrl.setAttribute("list", OmHooks.GLOBAL_IDS.PUBLIC_GAME_HOST_URLS);
			const suggestedHostDesc = TopLevel.WebpageHostTypeSuggestedHost[this.top.webpageHostType];
			if (suggestedHostDesc) {
				const suggestOpt = JsUtils.html("option", [], {
					value: suggestedHostDesc.value,
					textContent: suggestedHostDesc.description,
				});
				const datalist = document.getElementById(OmHooks.GLOBAL_IDS.PUBLIC_GAME_HOST_URLS)!;
				datalist.insertAdjacentElement("afterbegin", suggestOpt);
				hostUrl.value = suggestOpt.value;
			}
		}{
			this.baseElem.appendChild(this.groupNameDataList);
		}{
			this.nav.next.classList.add(OmHooks.General.Class.INPUT_GROUP_ITEM);
			contentWrapper.appendChild(this.nav.next);
		}
		JsUtils.propNoWrite(this as GroupJoinerScreen, "in", "groupNameDataList");
		return contentWrapper;
	}
}
export namespace GroupJoinerScreen {
	export enum State {
		CHOOSING_HOST   = "choosing-host",
		CHOOSING_GROUP  = "choosing-group",
		IN_GROUP        = "in-group",
	};
}
const State = GroupJoinerScreen.State;
type  State = GroupJoinerScreen.State;
Object.freeze(GroupJoinerScreen);
Object.freeze(GroupJoinerScreen.prototype);