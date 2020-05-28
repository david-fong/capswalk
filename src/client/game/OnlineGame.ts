// Tell WebPack about the CSS chunk we want:
require("assets/style/game/index.css");

import {
    applyMixins,
    Game,
    Coord, VisibleTile, VisibleGrid,
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

    declare public readonly currentOperator: OperatorPlayer<S>;

    declare public htmlElements: BrowserGameMixin.HtmlElements;

    public readonly socket: SocketIOClient.Socket;

    /**
     * @override
     */
    protected _getGridImplementation(coordSys: S): VisibleGrid.ClassIf<S> {
        return VisibleGrid.getImplementation(coordSys);
    }


    /**
     * Note that this class does not extend `GameManager`.
     *
     * @param socket -
     * @param gameDesc - This should come from a Server event by the name
     *      {@link Game.CtorArgs.EVENT_NAME}.
     */
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

        // TODO.impl Send ack?
        this.socket.on(
            Game.Serialization.EVENT_NAME,
            async (ser: Game.ResetSer<S>) => {
                await this.reset();
                this.deserializeResetState(ser);
            },
        );
    }

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
