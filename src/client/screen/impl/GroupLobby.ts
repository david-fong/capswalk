import { Player } from "defs/TypeDefs";
import { Group } from "defs/OnlineDefs";
import { Game } from "game/Game";

import { OmHooks, Coord, SkScreen, StorageHooks } from "../SkScreen";
type SID = SkScreen.Id.GROUP_LOBBY;
const OMHC = OmHooks.Screen.Impl.GroupLobby.Class;

/**
 *
 */
export class GroupLobbyScreen extends SkScreen<SID> {

    /**
     * If not `undefined`, then the client is the group host.
     */
    private _gameCtorArgs?: Game.CtorArgs<Game.Type.SERVER,Coord.System>;

    private readonly _players: Record<string, GroupLobbyScreen.UserInfo>;
    private readonly teamsElem: HTMLElement;
    private readonly teamElems: Record<number, HTMLElement>;

    private readonly in: Readonly<{
        username: HTMLInputElement;
        teamId:   HTMLInputElement;
    }>;

    /**
     * @override
     */
    public get initialScreen(): SkScreen.Id {
        return SkScreen.Id.GROUP_JOINER;
    }
    /**
     * @override
     */
    public getNavPrevArgs(): SkScreen.NavPrevRet<SkScreen.Id.GROUP_JOINER | SkScreen.Id.SETUP_ONLINE> {
        return (this._gameCtorArgs)
            ? [SkScreen.Id.SETUP_ONLINE, {}, "backward",]
            : [SkScreen.Id.GROUP_JOINER, {}, "backward",];
    };

    /**
     * @override
     */
    protected _lazyLoad(): void {
        // @ts-expect-error : RO=
        this._players = {};
        this._createInputs();

        /* @ts-expect-error : RO= */
        {this.teamsElem = document.createElement("div");
        this.teamsElem.classList.add(OMHC.SEC_TEAMS);
        this.baseElem.appendChild(this.teamsElem);}

        // @ts-expect-error : RO=
        this.teamElems = {};

        {const start = this.nav.next;
        start.textContent = "Start";
        start.onclick = () => {
            if (this._gameCtorArgs) {
                console.log(this._gameCtorArgs);
                this.top.socket!.emit(Game.CtorArgs.EVENT_NAME, this._gameCtorArgs);
            }
        }
        this.baseElem.appendChild(start);}
    }

    /**
     */
    private _createInputs(): void {
        const base = document.createElement("div");
        base.classList.add(
            OmHooks.General.Class.INPUT_GROUP,
            OMHC.SEC_CLIENT_INFO,
        );

        const reqUserInfoChange = (ev: Event): void => {
            if (!this.in.username.validity.valid || !this.in.teamId.validity.valid) {
                return;
            }
            this.top.socket!.emit(Group.Socket.UserInfoChange.EVENT_NAME, <Group.Socket.UserInfoChange.Req>{
                username: this.in.username.value,
                teamId: parseInt(this.in.teamId.value),
                avatar: Player.Avatar.LOREM_IPSUM, // TODO.impl add an input field for `userInfo.avatar`.
            });
        };
        const uname = Object.assign(document.createElement("input"), <Partial<HTMLInputElement>>{
            type      : "text",
            minLength : 1,
            maxLength : Player.Username.MAX_LENGTH,
            pattern   : Player.Username.REGEXP.source,
            value     : localStorage.getItem(StorageHooks.LocalKeys.USERNAME) ?? "",
            onchange  : reqUserInfoChange,
        });
        uname.classList.add(OmHooks.General.Class.INPUT_GROUP_ITEM);
        base.appendChild(uname);

        const teamId    = Object.assign(document.createElement("input"), <Partial<HTMLInputElement>>{
            type     : "number",
            min      : "0",
            max      : "0",
            step     : "1",
            value    : "0",
            onchange : reqUserInfoChange,
        });
        teamId.classList.add(OmHooks.General.Class.INPUT_GROUP_ITEM);
        base.appendChild(teamId);

        const avatar    = document.createElement("select");
        // TODO.impl avatar selection element

        // @ts-expect-error : RO=
        this.in = Object.freeze({
            username: uname,
            teamId,
        });
        this.baseElem.appendChild(base);
    }

    /**
     * @override
     */
    protected async _abstractOnBeforeEnter(args: SkScreen.EntranceArgs[SID]): Promise<void> {
        if (args.manner !== "anyone : return from game") {
            this._gameCtorArgs = args.gameCtorArgs;
            this.nav.next.disabled = (this._gameCtorArgs === undefined);

            this.top.socket!.on(
                Group.Socket.UserInfoChange.EVENT_NAME,
                this._onUserInfoChange.bind(this),
            );
            // Listen for when the server sends tbe game constructor arguments:
            this.top.socket!.once(
                Game.CtorArgs.EVENT_NAME,
                async (gameCtorArgs: Game.CtorArgs<Game.Type.ONLINE,Coord.System>) => {
                    this.requestGoToScreen(SkScreen.Id.PLAY_ONLINE, gameCtorArgs);
                },
            );

            this.teamsElem.textContent = "";
            // ^Make sure this element is clear of any players from previous, different groups.
            this.nav.prev.textContent = "Return To " + (this._gameCtorArgs) ? "Setup" : "Joiner";
        }
    }

    /**
     * @override
     */
    protected _abstractOnBeforeLeave(): boolean {
        // Make sure we stop listening for the game to start
        // in case it hasn't started yet:
        this.top.socket!.removeListener(Game.CtorArgs.EVENT_NAME);

        return true;
    }

    /**
     */
    private _onUserInfoChange(res: Group.Socket.UserInfoChange.Res): void {
        Object.entries(res).forEach(([socketId, desc]) => {
            const userInfo = this._players[socketId];

            // If player is in a team on their own and they are leaving it:
            if (userInfo && this.teamElems[userInfo.teamId].childElementCount === 1
                && (desc === undefined || desc.teamId !== userInfo.teamId)) {
                this.teamElems[userInfo.teamId].remove();
                delete this.teamElems[userInfo.teamId];
            }

            // If player is joining a team that has no HTML element yet:
            if (desc && this.teamElems[desc.teamId] === undefined) {
                const teamElem = this.teamElems[desc.teamId] = document.createElement("div");
                teamElem.classList.add(OMHC.TEAM);
                teamElem.onclick = (ev) => {
                    this.in.teamId.value = desc.teamId.toString();
                }
                this.teamsElem.appendChild(teamElem);
            }

            if (desc === undefined) {
                // Player has left the group:
                userInfo.base.remove();
                delete this._players[socketId];
            } else if (userInfo === undefined) {
                // New player has joined the group:
                const userInfo
                    = this._players[socketId]
                    = new GroupLobbyScreen.UserInfo(desc);
                this.teamElems[desc.teamId].appendChild(userInfo.base);
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
    export type EntranceArgs = Readonly<({
        manner: "group-host : join";
        gameCtorArgs: Game.CtorArgs<Game.Type.SERVER,Coord.System> | undefined;
    } | {
        manner: "non-group-host : join";
        gameCtorArgs?: undefined;
    } | {
        manner: "anyone : return from game";
        gameCtorArgs?: undefined;
    })>;

    /**
     */
    export class UserInfo implements Player.UserInfo {
        #username: Player.Username;
        #teamId:   number;
        #avatar: Player.Avatar;

        public base: HTMLElement;
        private el: Readonly<{
            username: HTMLElement;
            teamId: HTMLElement;
            avatar: HTMLElement;
        }>;

        public constructor(desc: Player.UserInfo) {
            this.base = document.createElement("div");
            this.base.classList.add(OMHC.PLAYER);
            this.el = Object.freeze(<UserInfo["el"]>{
                username: document.createElement("div"),
                teamId: document.createElement("div"),
                avatar: document.createElement("div"),
            });
            this.base.appendChild(this.el.avatar);
            this.base.appendChild(this.el.username);
            this.base.appendChild(this.el.teamId);
            this.username = desc.username;
            this.teamId = desc.teamId;
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
Object.freeze(GroupLobbyScreen);
Object.freeze(GroupLobbyScreen.prototype);