import * as io from "socket.io-client";

import { Game } from "game/Game";

import { Coord, VisibleTile }   from "floor/VisibleTile";
import { VisibleGrid }          from "floor/VisibleGrid";

import { Player }               from "game/player/Player";
import { OperatorPlayer }       from "game/player/OperatorPlayer";
import { VisiblePlayerStatus }  from "game/player/VisiblePlayerStatus";

import { PlayerActionEvent }    from "game/events/PlayerActionEvent";
import { GameEvents }           from "game/__gameparts/Events";


type G = Game.Type.ONLINE;

/**
 *
 *
 * @extends Game
 */
export class OnlineGame<S extends Coord.System> extends GameEvents<G,S> {

    public readonly socket: SocketIOClient.Socket;

    /**
     * @override
     */
    protected __getGridImplementation(coordSys: S): VisibleGrid.ClassIf<S> {
        return VisibleGrid.getImplementation(coordSys);
    }



    /**
     * _Calls recursively for this entire composition._
     *
     * Note that this class does not extend `GameManager`.
     *
     * @param socket -
     * @param gameDesc - This should come from a Server event by the name
     *      {@link Game.CtorArgs.EVENT_NAME}.
     */
    public constructor(
        socket: SocketIOClient.Socket,
        htmlHosts: Game.HtmlHosts,
        gameDesc: Game.CtorArgs<G,S>,
    ) {
        super(
            Game.Type.ONLINE, {
            tileClass: VisibleTile,
            htmlHosts,
            playerStatusCtor: VisiblePlayerStatus,
            }, gameDesc,
        );
        this.socket = socket;

        this.socket.off(PlayerActionEvent.EVENT_NAME.Movement);
        this.socket.on(
            PlayerActionEvent.EVENT_NAME.Movement,
            this.executePlayerMoveEvent
        );
        this.socket.off(PlayerActionEvent.EVENT_NAME.Bubble);
        this.socket.on(
            PlayerActionEvent.EVENT_NAME.Bubble,
            this.executePlayerBubbleEvent,
        );

        // TODO.impl Send ack?
        this.socket.on(
            Game.Serialization.EVENT_NAME,
            (ser: Game.ResetSer<S>) => {
                this.reset();
                this.deserializeResetState(ser);
            },
        );

        // =====================================
        // CALL TO RESET
        this.reset();
        // =====================================
    }

    /**
     * @override
     */
    public reset(): void {
        super.reset();
    }

    protected __createOperatorPlayer(desc: Player.__CtorArgs<"HUMAN">): OperatorPlayer<S> {
        return new OperatorPlayer(this, desc);
    }

    protected __createArtifPlayer(desc: Player.CtorArgs): Player<S> {
        return new Player(this, desc);
    }



    public setTimeout(callback: TimerHandler, millis: number, ...args: any[]): number {
        return setTimeout(callback, millis, args);
    }

    public cancelTimeout(handle: number): void {
        clearTimeout(handle);
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
Object.freeze(OnlineGame);
Object.freeze(OnlineGame.prototype);
