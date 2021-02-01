import type { Socket } from "socket.io-client";
import { Player } from "defs/TypeDefs";
import { Group, GroupEv, GameEv } from "defs/OnlineDefs";
import type { Game } from "game/Game";

import { JsUtils, OmHooks, BaseScreen } from "../../BaseScreen";
type SID = BaseScreen.Id.GROUP_LOBBY;
import style from "./style.m.css";

/**
 */
export class GroupLobbyScreen extends BaseScreen<SID> {

	/**
	 * A map from socket ID's to descriptors of players' info.
	 */
	private readonly _players:  Map<string, GroupLobbyScreen.UserInfo>;
	private readonly teamsElem: HTMLElement;
	private readonly teamElems: Map<number, HTMLElement>;

	private readonly in: Readonly<{
		username: HTMLInputElement;
		teamId:   HTMLInputElement;
		avatar:   HTMLSelectElement;
	}>;

	private get socket(): Socket {
		return this.top.sockets.groupSocket!;
	}

	/**
	 * @override
	 */
	protected _lazyLoad(): void {
		this.baseElem.classList.add(style["this"]);
		// @ts-expect-error : RO=
		this._players = new Map();
		this._createInputs();
		this.nav.prev.textContent = "Return To Joiner";

		/* @ts-expect-error : RO= */
		this.teamsElem = JsUtils.html("div", [style["teams-section"]]);
		this.baseElem.appendChild(this.teamsElem);

		// @ts-expect-error : RO=
		this.teamElems = new Map();

		JsUtils.propNoWrite(this as GroupLobbyScreen,
			"_players", "teamsElem", "teamElems", "in",
		);

		{const goSetup = this.nav.next;
		goSetup.textContent = "Setup Game";
		goSetup.onclick = () => {
			this.requestGoToScreen(BaseScreen.Id.SETUP_ONLINE, {});
		};
		this.baseElem.appendChild(goSetup);}
	}

	/**
	 */
	private _createInputs(): void {
		const base = JsUtils.html("div", [
			OmHooks.General.Class.INPUT_GROUP,
			style["client-info-section"],
		]);

		const uname = JsUtils.html("input", [OmHooks.General.Class.INPUT_GROUP_ITEM], {
			type      : "text",
			minLength : 1,
			maxLength : Player.Username.MAX_LENGTH,
			pattern   : Player.Username.REGEXP.source,
			spellcheck: false,
			value     : this.top.storage.Local.username ?? "",
			onchange  : this._submitInputs.bind(this),
		});
		base.appendChild(uname);

		const teamId = JsUtils.html("input", [OmHooks.General.Class.INPUT_GROUP_ITEM], {
			type: "number", inputMode: "numeric",
			min: "0", max: "0", step: "1", value: "0",
			onchange: this._submitInputs.bind(this),
		});
		teamId.classList.add();
		base.appendChild(teamId);

		const avatar = JsUtils.html("select");
		// TODO.impl avatar selection element

		// @ts-expect-error : RO=
		this.in = Object.freeze<GroupLobbyScreen["in"]>({
			username: uname,
			teamId,
			avatar,
		});
		this.baseElem.appendChild(base);
	}
	private _submitInputs(): void {
		if (!this.in.username.validity.valid || !this.in.teamId.validity.valid) {
			return;
		}
		this.top.storage.Local.username = this.in.username.value;
		this.top.storage.Local.avatar   = this.in.avatar.value;
		this.socket.emit(Group.Socket.UserInfoChange.EVENT_NAME, <Group.Socket.UserInfoChange.Req>{
			username: this.in.username.value,
			teamId: parseInt(this.in.teamId.value),
			avatar: Player.Avatar.LOREM_IPSUM, // TODO.impl add an input field for `userInfo.avatar`.
		});
	};

	/** @override */
	protected async _abstractOnBeforeEnter(
		navDir: BaseScreen.NavDir,
		args: BaseScreen.EntranceArgs[SID],
	): Promise<void> {
		if (navDir === "forward") {
			this.nav.next.disabled = !this.top.clientIsGroupHost;
			this._players.clear();
			this.teamElems.clear();
			this.teamsElem.textContent = "";
			this._submitInputs();

			this.socket
			.off(Group.Socket.UserInfoChange.EVENT_NAME)
			.on (Group.Socket.UserInfoChange.EVENT_NAME,
				this._onUserInfoChange.bind(this),
			);
		}
		// Listen for when the server sends the game constructor arguments:
		this.socket.once(
			GroupEv.CREATE_GAME,
			() => {
				const login = this.top.groupLoginInfo;
				console.log("group create game socket. now waiting for ctor args. ");
				const sock = this.top.sockets.gameSocketConnect(
					login.name!,
					{ passphrase: login.passphrase! },
				);
				sock.once(GameEv.CREATE_GAME, (...args: [Game.CtorArgs, readonly number[]]) => {
					this.requestGoToScreen(BaseScreen.Id.PLAY_ONLINE, args); //🚀
				});
				// function ensureConnected(): void {
				//     if (!(sock.connected)) {
				//         console.log("ensure connected.");
				//         sock.connect();
				//         setTimeout(() => { ensureConnected(); }, 300);
				//     }
				// }
				// ensureConnected();
			},
		);
	}

	/** @override */
	public getRecommendedFocusElem(): HTMLElement {
		let elemToFocus: HTMLElement | undefined
			= (!this.in.username.validity.valid) ? this.in.username
			: (!this.in.teamId.validity.valid)   ? this.in.teamId
			: undefined;
		if (elemToFocus === undefined) {
			elemToFocus = (this.top.clientIsGroupHost) ? this.nav.next : this.in.teamId;
		}
		return elemToFocus;
	}

	/** @override */
	protected _abstractOnBeforeLeave(navDir: BaseScreen.NavDir): boolean {
		// Make sure we stop listening for the game to start
		// in case it hasn't started yet:
		if (navDir === BaseScreen.NavDir.BACKWARD) {
			this.socket.off(GroupEv.CREATE_GAME);
		}
		return true;
	}

	/**
	 */
	private _onUserInfoChange(res: Group.Socket.UserInfoChange.Res): void {
		Object.entries(res).forEach(([socketId, desc]) => {
			const userInfo = this._players.get(socketId);

			// If player is in a team on their own and they are leaving it:
			if (userInfo
				&& this.teamElems.get(userInfo.teamId)!.childElementCount === 1
				&& (desc === undefined || desc.teamId !== userInfo.teamId)) {
				this.teamElems.get(userInfo.teamId)!.remove();
				this.teamElems.delete(userInfo.teamId);
			}

			// If player is joining a team that has no HTML element yet:
			if (desc && !this.teamElems.has(desc.teamId)) {
				const teamElem = JsUtils.html("div", [style["team"]]);
				this.teamElems.set(desc.teamId, teamElem);
				teamElem.onclick = (ev) => {
					this.in.teamId.value = desc.teamId.toString();
				};
				this.teamsElem.appendChild(teamElem);
			}

			if (desc === undefined) {
				// Player has left the group:
				userInfo!.base.remove();
				this._players.delete(socketId);
			} else if (userInfo === undefined) {
				// New player has joined the group:
				const userInfo = new GroupLobbyScreen.UserInfo(desc);
				this._players.set(socketId, userInfo);
				this.teamElems.get(desc.teamId)!.appendChild(userInfo.base);
			} else {
				// Player changed their user information:
				userInfo.update(desc);
			}
		});
		this.in.teamId.max = Object.keys(this._players).length.toString();
	}
}
export namespace GroupLobbyScreen {
	/**
	 */
	export class UserInfo implements Player.UserInfo {
		#username: Player.Username;
		#teamId:   number;
		#avatar:   Player.Avatar;

		public readonly base: HTMLElement;
		private readonly el: Readonly<{
			username: HTMLElement;
			teamId: HTMLElement;
			avatar: HTMLElement;
		}>;

		public constructor(desc: Player.UserInfo) {
			this.base = JsUtils.html("div", [style["player"]]);
			const mkDiv = (): HTMLDivElement => {
				const div = JsUtils.html("div");
				this.base.appendChild(div);
				return div;
			};
			this.el = Object.freeze<UserInfo["el"]>({
				username: mkDiv(),
				teamId:   mkDiv(),
				avatar:   mkDiv(),
			});
			this.el.username.classList.add(style["player__name"]);
			this.username = desc.username;
			this.teamId = desc.teamId;
			JsUtils.propNoWrite(this as UserInfo, "base", "el");
		}

		public update(desc: Player.UserInfo): void {
			this.username = desc.username;
			this.teamId   = desc.teamId;
			this.avatar   = desc.avatar;
		};

		public get username(): Player.Username {
			return this.#username;
		}
		public set username(newUsername: Player.Username) {
			this.el.username.textContent = newUsername;
			this.#username = newUsername;
		}

		public get teamId(): number {
			return this.#teamId;
		}
		public set teamId(newTeamId: number) {
			this.el.teamId.textContent = newTeamId.toString();
			this.#teamId = newTeamId;
		}

		public get avatar(): Player.Avatar {
			return this.#avatar;
		}
		public set avatar(newAvatar: Player.Avatar) {
			this.#avatar = newAvatar;
			this.el.avatar; // TODO.impl set the avatar image.
		}
	}
}
JsUtils.protoNoEnum(GroupLobbyScreen, "_createInputs", "_submitInputs");
Object.freeze(GroupLobbyScreen);
Object.freeze(GroupLobbyScreen.prototype);