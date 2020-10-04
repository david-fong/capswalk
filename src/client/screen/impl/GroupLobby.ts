import { Player } from "defs/TypeDefs";
import { Group } from "defs/OnlineDefs";
import { Game } from "game/Game";

import { OmHooks, Coord, SkScreen } from "../SkScreen";
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
    private readonly playersElem: HTMLElement;

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
        (this._players as GroupLobbyScreen["_players"]) = {};
        this._createInputs();

        (this.playersElem as HTMLElement) = document.createElement("div");
        this.playersElem.classList.add(OMHC.SEC_PLAYERS);
        this.baseElem.appendChild(this.playersElem);

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
                unameNew: this.in.username.value,
                teamId: parseInt(this.in.teamId.value),
            });
        };
        const uname     = document.createElement("input");
        uname.classList.add(OmHooks.General.Class.INPUT_GROUP_ITEM);
        uname.type      = "text";
        uname.minLength = 1;
        uname.maxLength = Player.Username.MAX_LENGTH;
        uname.pattern   = Player.Username.REGEXP.source;
        uname.onchange  = reqUserInfoChange;
        base.appendChild(uname);

        const teamId    = document.createElement("input");
        teamId.classList.add(OmHooks.General.Class.INPUT_GROUP_ITEM);
        teamId.type     = "number";
        teamId.min      = "0";
        teamId.max      = "0";
        teamId.step     = "1";
        uname.onchange  = reqUserInfoChange;
        base.appendChild(teamId);

        (this.in as GroupLobbyScreen["in"]) = Object.freeze({
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

            this.playersElem.textContent = "";
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
        res.forEach((desc) => {
            if (desc.unameOld === undefined) {
                // New player has joined the group:
                if (this._players[desc.unameNew!]) throw "never";
                const userInfo
                    = this._players[desc.unameNew!]
                    = new GroupLobbyScreen.UserInfo(desc.unameNew!, desc.teamId);
                this.playersElem.appendChild(userInfo.base);
            } else if (desc.unameNew == undefined) {
                // Player has left the group:
                const el = this._players[desc.unameOld].base;
                el.remove();
                delete this._players[desc.unameOld];
            } else {
                // Player change their user information:
                const pui = this._players[desc.unameOld];
                pui.username = desc.unameNew;
                pui.teamId   = desc.teamId;
            }
            // TODO.impl If not deleting player, make sure items are sorted by teamId.
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
    export class UserInfo {
        #username: Player.Username;
        #teamId:   number;
        #avatar: Player.Avatar;

        public base: HTMLElement;
        private el: Readonly<{
            username: HTMLElement;
            teamId: HTMLElement;
            avatar: HTMLElement;
        }>;

        // TODO.design upon clicking, attempt to join that player's team.
        public constructor(username: Player.Username, teamId: number) {
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
            this.username = username;
            this.teamId = teamId;
        }

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