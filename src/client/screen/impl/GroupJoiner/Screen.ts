import { Group, JoinerEv, GameEv } from "defs/OnlineDefs";

import { JsUtils, BaseScreen, StorageHooks } from "../../BaseScreen";
import { _GroupJoinerScreenInitEl } from "./ScreenInitEl";

/** */
export class GroupJoinerScreen extends _GroupJoinerScreenInitEl {
	#isInGroup: boolean = false;
	#isHost: boolean = false; public get isHost(): boolean { return this.#isHost; }

	readonly #wsMessageCb: (ev: MessageEvent<string>) => void;
	private get ws(): WebSocket {
		return this.top.webSocket!;
	}

	/** @override */
	protected _lazyLoad(): void {
		super._lazyLoad();

		// @ts-expect-error : RO=
		this.#wsMessageCb = (ev: MessageEvent<string>) => {
			const [evName, ...args] = JSON.parse(ev.data) as [string, ...any[]];
			switch (evName) {
				case  JoinerEv.Create.NAME: this._onCreateResponse(args[0]); break;
				case   JoinerEv.Exist.NAME: this._onNotifyGroupExist(args[0]); break;
				case JoinerEv.TryJoin.NAME: this._setFormState(State.IN_GROUP); break;
				default: break;
			}
		};
		const huiSubmit = this._initServerUrlCbs();
		this._initGroupNameCbs(huiSubmit);
		this._initPassphraseCbs();
		Object.seal(this); //🧊
	}

	/** @override */
	public getRecommendedFocusElem(): HTMLElement {
		if (this.ws === undefined) {
			return this.in.serverUrl;
		} else {
			return this.in.groupName;
		}
	}


	/** */
	private _initServerUrlCbs(): VoidFunction {
		const top = this.top;
		const input = this.in.serverUrl;
		input.addEventListener("input", (ev) => {
			this._setFormState(State.CHOOSING_SERVER);
		});

		const submitInput = (): void => {
			if (!input.value || !input.validity.valid) return; //⚡

			if (this.ws !== undefined
				&& (new URL(this.ws.url)).hostname === (new URL(input.value)).hostname
			) {
				if (this.#isInGroup) {
					// Short-circuit when no change has occurred:
					this._setFormState(State.CHOOSING_GROUP);
				}
				return;
			}
			this.top.setWebSocket(new WebSocket(input.value));
			this.ws.addEventListener("open", (ev) => {
				this._setFormState(State.CHOOSING_GROUP);
			});
			this.ws.addEventListener("message", this.#wsMessageCb);
			this.ws.addEventListener("close", (ev) => {
				this.top.setWebSocket(undefined);
				this._setFormState(State.CHOOSING_SERVER);
				top.toast("You disconnected you from the server.");
				if (this.top.currentScreen !== this) {
					// TODO.impl ^ a more specific condition.
					this.requestGoToScreen(BaseScreen.Id.GROUP_JOINER, {});
				}
			}, { once: true });
		};
		// Link handler to events:
		input.addEventListener("keydown", (ev) => {
			if (ev.isTrusted && ev.key === "Enter") { submitInput(); }
		});
		input.addEventListener("paste", (ev) => {
			if (ev.isTrusted) { window.setTimeout(() => submitInput(), 0); }
		});
		input.addEventListener("change", (ev) => {
			if (ev.isTrusted) { submitInput(); }
		});
		return submitInput;
	}
	/** */
	private _onCreateResponse(accepted: JoinerEv.Create.Res): void {
		if (accepted) {
			this.top.toast(`server accepted request to create new group \"${this.in.groupName.value}\".`);
			this.top.toast("connecting to new group...");
			this._attemptToJoinExistingGroup();
			return;
		} else {
			this.#isInGroup = true;
			this.top.toast(`The server rejected your request to`
			+ ` create a new group \"${this.in.groupName.value}\".`);
			return;
		}
	}
	/** */
	private _onNotifyGroupExist(changes: JoinerEv.Exist.Sse): void {
		type OptEl = HTMLOptionElement;
		const mkOpt = (groupName: Group.Name): OptEl => {
			// If we didn't know about this group yet, create a new
			// option for it (Insert into list in alphabetical order):
			const newOpt = JsUtils.html("option", [], { value: groupName });
			for (const otherOpt of dataListArr) {
				if (newOpt.value.localeCompare(otherOpt.value) < 0) {
					this.groupNameDataList.insertBefore(newOpt, otherOpt);
					break;
				}
			}
			if (!newOpt.parentElement) {
				this.groupNameDataList.appendChild(newOpt);
			}
			return newOpt;
		};
		const dataListArr = Array.from(this.groupNameDataList.children) as OptEl[];
		Object.entries(changes).freeze().forEach(([groupName, status]) => {
			const opt = dataListArr.find((opt: OptEl) => opt.value === groupName) ?? mkOpt(groupName);
			switch (status) {
				case JoinerEv.Exist.Status.IN_LOBBY: opt.textContent = "In Lobby"; break;
				case JoinerEv.Exist.Status.IN_GAME:  opt.textContent = "In Game"; break;
				case JoinerEv.Exist.Status.DELETE:   opt.remove(); break;
			}
		});
	}

	/** */
	private _initGroupNameCbs(serverUrlInputSubmit: VoidFunction): void {
		const input = this.in.groupName;
		input.addEventListener("input", (ev): void => {
			if (!ev.isTrusted) return;
			if (this.state === State.IN_GROUP) {
				serverUrlInputSubmit();
				// ^This will take us back to the state `CHOOSING_GROUP`.
			}
			this.in.passphrase.value = "";
			this.#isHost = false;
		});

		const submitInput = (): void => {
			if (!input.value || !input.validity.valid) return;
			if (this.state === State.IN_GROUP) {
				this.nav.next.focus();
			} else {
				this.in.passphrase.focus();
			}
		};
		input.addEventListener("keydown", (ev) => {
			if (ev.isTrusted && ev.key === "Enter") { submitInput(); }
		});
		input.addEventListener("change", (ev) => {
			if (ev.isTrusted) { submitInput(); }
		});
	}

	/** */
	private _initPassphraseCbs(): void {
		const submitInput = (): void => {
			if (!this.in.passphrase.validity.valid) return;
			// Short-circuit when no change has occurred:
			if (this.#isInGroup) {
				this._setFormState(State.IN_GROUP);
			}

			const groupName = this.in.groupName.value;
			const groupExists = (Array.from(this.groupNameDataList.children) as HTMLOptionElement[])
				.some((opt) => opt.value === groupName);
			if (groupExists) {
				this.#isHost = false;
				this._attemptToJoinExistingGroup();
			} else {
				this.#isHost = true;
				this.ws.send(JSON.stringify([
					JoinerEv.Create.NAME,
					Object.freeze(<JoinerEv.Create.Req>{
						groupName: this.in.groupName.value,
						passphrase: this.in.passphrase.value,
					}),
				]));
			}
		};
		this.in.passphrase.addEventListener("keydown", (ev) => {
			if (ev.isTrusted && ev.key === "Enter") { submitInput(); }
		});
	}

	/** */
	private _attemptToJoinExistingGroup(): void {
		this.ws.send(JSON.stringify([JoinerEv.TryJoin.NAME, <JoinerEv.TryJoin.Req>{
			groupName: this.in.groupName.value,
			passphrase: this.in.passphrase.value,
			userInfo: StorageHooks.getLastUserInfo(),
		}]));
	}
}
export namespace GroupJoinerScreen {
}
const State = _GroupJoinerScreenInitEl.State;
type  State = _GroupJoinerScreenInitEl.State;
Object.freeze(GroupJoinerScreen);
Object.freeze(GroupJoinerScreen.prototype);