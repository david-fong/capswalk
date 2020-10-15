// Tell WebPack about the CSS chunk we want:
require("assets/style/game/_barrel.css");

import { GameEv } from "defs/OnlineDefs";
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

        this.socket.off(PlayerActionEvent.EVENT_NAME.Movement); // TODO.impl change these to assertions that there are no listeners.
        this.socket.on(
            PlayerActionEvent.EVENT_NAME.Movement,
            this.executePlayerMoveEvent.bind(this),
        );
        this.socket.off(PlayerActionEvent.EVENT_NAME.Bubble);
        this.socket.on(
            PlayerActionEvent.EVENT_NAME.Bubble,
            this.executePlayerBubbleEvent.bind(this),
        );

        this.socket.off(GameEv.RESET);
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

    // TODO.design Rethink this... If we really go with this, everything iterating
    // through Game.players will need to check for undefined. Also, everything that
    // could possibly (and does) get a hold of a Player object must be notified when
    // that Player leaves... Sounds like this is just an unfortunately bad idea...
    public onPlayerLeave(socketId: string): void {
        this.players.filter((player) => player.socketId === socketId).forEach((player) => {
            player.tile.at().evictOccupant();
            // @ts-expect-error : RO=
            player.hostTile = undefined;
            // @ts-expect-error : RO=
            this.players[player.playerId] = undefined;
            // @ts-expect-error : RO[]
            player.team.members.splice(player.team.members.indexOf(player));
        });
    }
}
export interface OnlineGame<S extends Coord.System> extends BrowserGameMixin<G,S> {};
JsUtils.applyMixins(OnlineGame, [BrowserGameMixin,]);
Object.freeze(OnlineGame);
Object.freeze(OnlineGame.prototype);