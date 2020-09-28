import { Game } from "game/Game";

import { OmHooks, SkScreen } from "../SkScreen";
type SID = SkScreen.Id.GROUP_LOBBY;

/**
 *
 */
export class GroupLobbyScreen extends SkScreen<SID> {

    private _gameCtorArgs?: Game.CtorArgs<Game.Type.SERVER,any>;

    /**
     * Automatically disabled if the client is not the group host.
     */
    private startBtn: HTMLButtonElement;

    public get initialScreen(): SkScreen.Id {
        return SkScreen.Id.GROUP_JOINER;
    }

    /**
     * @override
     */
    protected _lazyLoad(): void {
        {const startBtn
            = (this.startBtn as HTMLButtonElement)
            = document.createElement("button");
        startBtn.textContent = "Start";
        startBtn.onclick = () => {
            if (this._gameCtorArgs) {
                this.top.socket!.emit(Game.CtorArgs.EVENT_NAME, this._gameCtorArgs);
            }
        }
        this.baseElem.appendChild(startBtn);}
    }

    /**
     * @override
     */
    protected async _abstractOnBeforeEnter(args: SkScreen.EntranceArgs<SID>): Promise<void> {
        this._gameCtorArgs = args;
        this.startBtn.disabled = (this._gameCtorArgs === undefined);

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
