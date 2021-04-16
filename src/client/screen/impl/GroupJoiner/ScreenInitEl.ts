import { TopLevel } from "client/TopLevel";
import { Group } from "defs/OnlineDefs";

import { JsUtils, OmHooks, BaseScreen } from "../../BaseScreen";
import style from "./style.m.css";
type SID = BaseScreen.Id.GROUP_JOINER;

/** */
export abstract class _GroupJoinerScreenInitEl extends BaseScreen<SID> {

	#state: _GroupJoinerScreenInitEl.State;
	public get state(): State {
		return this.#state;
	}
	protected readonly in: Readonly<{
		serverUrl:  HTMLInputElement;
		groupName:  HTMLInputElement;
		passphrase: HTMLInputElement;
	}>;
	protected readonly groupNameDataList = JsUtils.html("datalist", [], { id: OmHooks.ID.CURRENT_HOST_GROUPS });


	/** @override */
	protected _abstractLazyLoad(): void {
		this.baseElem.classList.add(
			OmHooks.General.Class.CENTER_CONTENTS,
			style["this"],
		);
		const contentWrapper = this._initFormContents();
		this.baseElem.appendChild(this.groupNameDataList);

		this.nav.prev.classList.add(OmHooks.General.Class.INPUT_GROUP_ITEM);
		this.nav.next.classList.add(OmHooks.General.Class.INPUT_GROUP_ITEM);
		contentWrapper.appendChild(this.nav.prev);
		contentWrapper.appendChild(this.nav.next);

		this.nav.next.onclick = (ev) => {
			// No validation needed. The next button is only enabled if inputs are valid.
			this.requestGoToScreen(BaseScreen.Id.GROUP_LOBBY, void 0);
		};
		this._setFormState(State.CHOOSING_SERVER);
		this.baseElem.appendChild(contentWrapper);
	}

	/** Doesn't touch sockets. */
	protected _setFormState(newState: State): void {
		if (this.state === newState) return; //⚡ (No other short circuits here please)

		this.in.passphrase.disabled = true;
		if (newState === State.IN_GROUP) {
			if (this.state !== State.CHOOSING_GROUP) {
				throw new Error("never"); // Illegal state transition.
			}
			this.nav.next.disabled = false;
			this.nav.next.focus();

		} else {
			this.nav.next.disabled = true;
			this.in.passphrase.value = "";

			if (newState === State.CHOOSING_SERVER) {
				this.in.groupName.disabled  = true;
				this.in.groupName.value     = "";
				// Fun fact on an alternative for clearing children: https://stackoverflow.com/a/22966637/11107541
				this.groupNameDataList.textContent = "";
				this.in.serverUrl.focus();

			} else if (newState === State.CHOOSING_GROUP) {
				this.in.groupName.disabled  = false;
				this.in.passphrase.disabled = false;
				this.in.groupName.focus();
			}
		}
		this.#state = newState;
	}

	/** A helper for `_lazyLoad`. Does not hook up event processors. */
	private _initFormContents(): HTMLElement {
		const contentWrapper = JsUtils.html("div"/*"form"*/, [
			OmHooks.General.Class.INPUT_GROUP,
			style["content-wrapper"],
		], {});
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
		type InArgs = Partial<HTMLInputElement>;
		// @ts-expect-error : RO=
		this.in = Object.freeze({
			"serverUrl": Object.assign(_mkInput("Server URL", style["server-url"]), <InArgs>{
				type: "url",
				maxLength: 128,
				autocomplete: "on",
				required: true,
			}),
			"groupName": Object.assign(_mkInput("Group Name", style["group-name"]), <InArgs>{
				pattern: Group.Name.REGEXP.source,
				minLength: 1,
				maxLength: Group.Name.MaxLength,
				autocomplete: "on",
				required: true,
			}),
			"passphrase": Object.assign(_mkInput("Group Passphrase", style["passphrase"]), <InArgs>{
				pattern: Group.Passphrase.REGEXP.source,
				maxLength: Group.Passphrase.MaxLength,
			}),
		});
		this.in.groupName.setAttribute("list", OmHooks.ID.CURRENT_HOST_GROUPS);

		{
			this.in.serverUrl.setAttribute("list", OmHooks.ID.PUBLIC_GAME_SERVER_URLS);
			const suggest = TopLevel.SiteServerTypeSuggestedGameServer[this.top.siteServerType];
			if (suggest) {
				const suggestOpt = JsUtils.html("option", [], {
					value: suggest.value,
					textContent: suggest.description,
				});
				const datalist = document.getElementById(OmHooks.ID.PUBLIC_GAME_SERVER_URLS)!;
				datalist.insertAdjacentElement("afterbegin", suggestOpt);
				this.in.serverUrl.value = suggestOpt.value;
			}
		}

		JsUtils.propNoWrite(this as _GroupJoinerScreenInitEl, "in", "groupNameDataList");
		return contentWrapper;
	}
}
export namespace _GroupJoinerScreenInitEl {
	export enum State {
		CHOOSING_SERVER = "choosing-server",
		CHOOSING_GROUP  = "choosing-group",
		IN_GROUP        = "in-group",
	}
}
const State = _GroupJoinerScreenInitEl.State;
type  State = _GroupJoinerScreenInitEl.State;
Object.freeze(_GroupJoinerScreenInitEl);
Object.freeze(_GroupJoinerScreenInitEl.prototype);