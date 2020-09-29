import { Player } from "defs/TypeDefs";
import { Group } from "defs/OnlineDefs";
import { Game } from "game/Game";

import { OmHooks, SkScreen } from "../SkScreen";
type SID = SkScreen.Id.GROUP_LOBBY;

/**
 *
 */
export class GroupLobbyScreen extends SkScreen<SID> {

    private _gameCtorArgs?: Game.CtorArgs<Game.Type.SERVER,any>;

    private readonly in: Readonly<{
        username: HTMLInputElement;
        teamId:   HTMLInputElement;
    }>;

    public get initialScreen(): SkScreen.Id {
        return SkScreen.Id.GROUP_JOINER;
    }

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

        this.top.socket!.on(Group.Socket.UserInfoChange.EVENT_NAME, (res: Group.Socket.UserInfoChange.Res) => {
            // TODO.impl first, add a dictionary for player user info descs.
        });
    }

    private _createInputs(): void {
        const uname = document.createElement("input");
        uname.type = "text";
        uname.minLength = 1;
        uname.maxLength = Player.Username.MAX_LENGTH;
        uname.pattern   = Player.Username.REGEXP.source;
        uname.onchange  = this._onUserInfoChange.bind(this);
        this.baseElem.appendChild(uname);

        const teamId = document.createElement("input");
        teamId.type = "number";
        teamId.min  = "0";
        teamId.max  = "0";
        uname.onchange = this._onUserInfoChange.bind(this);
        this.baseElem.appendChild(teamId);

        (this.in as GroupLobbyScreen["in"]) = Object.freeze({
            username: uname,
            teamId,
        });
    }
    private _onUserInfoChange(ev: Event): void {
        // TODO.impl
        if (!this.in.username.validity.valid || !this.in.teamId.validity.valid) {
            return;
        }
        this.top.socket!.emit(Group.Socket.UserInfoChange.EVENT_NAME, <Group.Socket.UserInfoChange.Req>{
            unameNew: this.in.username.value,
            teamId: Number(this.in.teamId.value),
        });
    }

    /**
     * @override
     */
    protected async _abstractOnBeforeEnter(args: SkScreen.EntranceArgs[SID]): Promise<void> {
        this._gameCtorArgs = args; // TODO.impl don't overwrite if args has no fields.
        // that means the caller is indicating a backward navigation. Maybe it would
        // be better to have the argument type take strings to indicate the intent /
        // context of the call.
        this.nav.next.disabled = (this._gameCtorArgs === undefined);

        // Listen for when the server sends tbe game constructor arguments:
        this.top.socket!.once(
            Game.CtorArgs.EVENT_NAME,
            async (gameCtorArgs: Game.CtorArgs<Game.Type.ONLINE,any>) => {
                this.requestGoToScreen(SkScreen.Id.PLAY_ONLINE, gameCtorArgs);
            },
        );
        return;
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
}
Object.freeze(GroupLobbyScreen);
Object.freeze(GroupLobbyScreen.prototype);