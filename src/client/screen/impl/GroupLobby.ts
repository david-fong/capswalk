import { Player } from "defs/TypeDefs";
import { Group } from "defs/OnlineDefs";
import { Game } from "game/Game";

import { OmHooks, Coord, SkScreen } from "../SkScreen";
type SID = SkScreen.Id.GROUP_LOBBY;

/**
 *
 */
export class GroupLobbyScreen extends SkScreen<SID> {

    /**
     * If not `undefined`, then the client is the group host.
     */
    private _gameCtorArgs?: Game.CtorArgs<Game.Type.SERVER,Coord.System>;

    private _players: Record<string, GroupLobbyScreen.UserInfo>;

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
        this._createInputs();

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
        const reqUserInfoChange = (ev: Event): void => {
            if (!this.in.username.validity.valid || !this.in.teamId.validity.valid) {
                return;
            }
            this.top.socket!.emit(Group.Socket.UserInfoChange.EVENT_NAME, <Group.Socket.UserInfoChange.Req>{
                unameNew: this.in.username.value,
                teamId: Number(this.in.teamId.value),
            });
        };
        const uname     = document.createElement("input");
        uname.type      = "text";
        uname.minLength = 1;
        uname.maxLength = Player.Username.MAX_LENGTH;
        uname.pattern   = Player.Username.REGEXP.source;
        uname.onchange  = reqUserInfoChange;
        this.baseElem.appendChild(uname);

        const teamId    = document.createElement("input");
        teamId.type     = "number";
        teamId.min      = "0";
        teamId.max      = "0";
        uname.onchange  = reqUserInfoChange;
        this.baseElem.appendChild(teamId);

        (this.in as GroupLobbyScreen["in"]) = Object.freeze({
            username: uname,
            teamId,
        });
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
        }
        this.nav.prev.textContent = "Return To " + (this._gameCtorArgs) ? "Setup" : "Joiner";
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

    private _onUserInfoChange(res: Group.Socket.UserInfoChange.Res): void {
        if (res.unameOld === undefined) {
            // New player has joined the group:
            if (this._players[res.unameNew!]) throw "never";
            this._players[res.unameNew!] = new GroupLobbyScreen.UserInfo(res.unameNew!, res.teamId);
        } else if (res.unameNew == undefined) {
            // Player has left the group:
            delete this._players[res.unameOld];
        } else {
            // Player change their user information:
            const pui = this._players[res.unameOld];
            pui.username = res.unameNew;
            pui.teamId   = res.teamId;
        }
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

    export class UserInfo {
        username: Player.Username;
        teamId: number;
        base: HTMLElement;

        public constructor(username: Player.Username, teamId: number) {
            this.username = username;
            this.teamId = teamId;
            this.base = document.createElement("div");
        }
    }
}
Object.freeze(GroupLobbyScreen);
Object.freeze(GroupLobbyScreen.prototype);