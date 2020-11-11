import type { Socket } from "socket.io-client/build/socket";
import { GameEv, SkServer } from "defs/OnlineDefs";
import {
    JsUtils,
    Game,
    Coord, VisibleTile,
    BrowserGameMixin,
    Player, OperatorPlayer, VisiblePlayerStatus,
} from "./BrowserGame";

import { PlayerActionEvent }    from "game/events/PlayerActionEvent";
import { GamepartEvents }       from "game/gameparts/GamepartEvents";


type G = Game.Type.ONLINE;

/**
 *
 */
export class OnlineGame<S extends Coord.System>
extends GamepartEvents<G,S> implements BrowserGameMixin<G,S> {

    /**
     * @override
     */
    // @ts-expect-error : Redeclaring accessor as property.
    declare public readonly currentOperator: OperatorPlayer<S>;

    /**
     * @override
     */
    declare public htmlElements: BrowserGameMixin.HtmlElements;

    public readonly socket: Socket;


    /**
     * Note that this class does not extend `GameManager`.
     *
     * @param gameSocket - Used to make a Game socket.
     * @param gameDesc - This should come from a Server event by the name {@link GameEv.CREATE}.
     */
    public constructor(
        onGameBecomeOver: () => void,
        gameSocket: Socket,
        gameDesc: Game.CtorArgs<G,S>,
    ) {
        super(
            Game.Type.ONLINE, {
            onGameBecomeOver,
            tileClass: VisibleTile,
            playerStatusCtor: VisiblePlayerStatus,
            }, gameDesc,
        );
        this.socket = gameSocket;
        this._ctorBrowserGame();

        if (DEF.DevAssert) {
            // Enforcer: SkSockets calls `offAny` upon socket disconnect.
            if (this.socket.hasListeners(PlayerActionEvent.EVENT_NAME.MOVEMENT)
             || this.socket.hasListeners(PlayerActionEvent.EVENT_NAME.BUBBLE)
             || this.socket.hasListeners(GameEv.RESET)
            ) {
                throw new Error("never");
            }
        }
        this.socket.on(
            PlayerActionEvent.EVENT_NAME.MOVEMENT,
            this.executePlayerMoveEvent.bind(this),
        );
        this.socket.on(
            PlayerActionEvent.EVENT_NAME.BUBBLE,
            this.executePlayerBubbleEvent.bind(this),
        );
        this.socket.on(
            GameEv.RESET,
            async (ser: Game.ResetSer<S>) => {
                await this.reset();
                this.deserializeResetState(ser);
                // See the PlayOnline screen for the registration of
                // listeners for the server confirmation.
                this.socket.emit(GameEv.UNPAUSE);
            },
        );
        this.socket.emit(GameEv.RESET);
    }

    /**
     * @override
     */
    declare protected readonly _getGridImplementation: BrowserGameMixin<G,S>["_getGridImplementation"];

    /**
     * @override
     */
    protected _createArtifPlayer(desc: Player.CtorArgs): Player<S> {
        return new Player(this, desc);
    }


    /**
     * Normally calls {@link Game#processMoveExecute}. However, here,
     * that should be done as a callback to an event created by the
     * server.
     *
     * @override
     */
    public processMoveRequest(desc: PlayerActionEvent.Movement<S>): void {
        this.socket.emit(PlayerActionEvent.EVENT_NAME.MOVEMENT, desc);
    }

    /**
     * Normally calls {@link Game#processBubbleMakeExecute}. However,
     * here, that should be done as a callback to an event created by
     * the server.
     *
     * @override
     */
    public processBubbleRequest(desc: PlayerActionEvent.Bubble): void {
        this.socket.emit(PlayerActionEvent.EVENT_NAME.BUBBLE, desc);
    }
}
export interface OnlineGame<S extends Coord.System> extends BrowserGameMixin<G,S> {};
JsUtils.applyMixins(OnlineGame, [BrowserGameMixin]);
Object.freeze(OnlineGame);
Object.freeze(OnlineGame.prototype);