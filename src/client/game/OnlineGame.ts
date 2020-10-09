// Tell WebPack about the CSS chunk we want:
require("assets/style/game/_barrel.css");

import {
    applyMixins,
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

    public readonly socket: SocketIOClient.Socket;


    /**
     * Note that this class does not extend `GameManager`.
     *
     * @param socket -
     * @param gameDesc - This should come from a Server event by the name
     *      {@link Game.CtorArgs.EVENT_NAME}.
     */
    // TODO.design @all these socket events: expose a way to remove them all when going back to the lobby.
    public constructor(
        onGameBecomeOver: () => void,
        socket: SocketIOClient.Socket,
        gameDesc: Game.CtorArgs<G,S>,
    ) {
        super(
            Game.Type.ONLINE, {
            onGameBecomeOver,
            tileClass: VisibleTile,
            playerStatusCtor: VisiblePlayerStatus,
            }, gameDesc,
        );
        this.socket = socket;
        this._ctorBrowserGame();

        this.socket.off(PlayerActionEvent.EVENT_NAME.Movement);
        this.socket.on(
            PlayerActionEvent.EVENT_NAME.Movement,
            this.executePlayerMoveEvent.bind(this),
        );
        this.socket.off(PlayerActionEvent.EVENT_NAME.Bubble);
        this.socket.on(
            PlayerActionEvent.EVENT_NAME.Bubble,
            this.executePlayerBubbleEvent.bind(this),
        );

        this.socket.off(Game.Serialization.EVENT_NAME);
        this.socket.on(
            Game.Serialization.EVENT_NAME,
            async (ser: Game.ResetSer<S>) => {
                await this.reset();
                this.deserializeResetState(ser);
                // See the PlayOnline screen for the registration of
                // listeners for the event SERVER_APPROVE_UNPAUSE.
                this.socket.emit(Game.CtorArgs.EVENT_NAME_CLIENT_READY_UNPAUSE);
            },
        );
        this.socket.emit(Game.CtorArgs.EVENT_NAME_CLIENT_READY_RESET);
    }

    declare protected readonly _getGridImplementation: BrowserGameMixin<G,S>["_getGridImplementation"];

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
        this.socket.emit(PlayerActionEvent.EVENT_NAME.Movement, desc);
    }

    /**
     * Normally calls {@link Game#processBubbleMakeExecute}. However,
     * there, that should be done as a callback to an event created by
     * the server.
     *
     * @override
     */
    public processBubbleRequest(desc: PlayerActionEvent.Bubble): void {
        this.socket.emit(PlayerActionEvent.EVENT_NAME.Bubble, desc);
    }
}
export interface OnlineGame<S extends Coord.System> extends BrowserGameMixin<G,S> {};
applyMixins(OnlineGame, [BrowserGameMixin,]);
Object.freeze(OnlineGame);
Object.freeze(OnlineGame.prototype);