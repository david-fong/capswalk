import * as io from "socket.io-client";

import { Game } from "game/Game";

import { LocalGameSettings }    from "../webui/GameSettings";
import { Coord, VisibleTile }   from "floor/VisibleTile";
import { VisibleGrid }          from "floor/VisibleGrid";

import { Player }               from "game/player/Player";
import { OperatorPlayer }       from "game/player/OperatorPlayer";
import { VisiblePlayerStatus }  from "game/player/VisiblePlayerStatus";

import { PlayerActionEvent }    from "game/events/PlayerActionEvent";
import { GameEvents }           from "game/__gameparts/Events";


type G = Game.Type.CLIENT;

/**
 *
 *
 * @extends Game
 */
export class ClientGame<S extends Coord.System> extends GameEvents<G,S> {

    protected settings: LocalGameSettings;

    public readonly socket: SocketIOClient.Socket;

    /**
     * @override
     */
    protected __getGridImplementation(coordSys: S): VisibleGrid.ClassIf<S> {
        return VisibleGrid.getImplementation(coordSys);
    }



    /**
     * _Calls Grid.reset for this composition (bypasses super)._
     *
     * @param socket -
     * @param gameDesc - This should come from a Server event by the name
     *      {@link Game.CtorArgs.EVENT_NAME}.
     */
    public constructor(
        socket: SocketIOClient.Socket,
        gameDesc: Game.CtorArgs<G,S>,
    ) {
        super(
            Game.Type.CLIENT, {
            tileClass: VisibleTile,
            playerStatusCtor: VisiblePlayerStatus,
            }, gameDesc,
        );
        if (!this.operator) {
            throw new Error("The Operator for a ClientGame should be defined.");
        }
        this.settings = LocalGameSettings.getInstance();
        this.socket = socket;

        this.socket.off(PlayerActionEvent.EVENT_NAME.Movement);
        this.socket.on(
            PlayerActionEvent.EVENT_NAME.Movement,
            this.processMoveExecute
        );
        this.socket.off(PlayerActionEvent.EVENT_NAME.Bubble);
        this.socket.on(
            PlayerActionEvent.EVENT_NAME.Bubble,
            this.processBubbleExecute,
        );

        this.reset();
    }

    /**
     * @override
     */
    public reset(): void {

        // TODO.impl Wait for a GameStateDump from the ServerGame. Send ack.
        // this.socket.once(
        //     Game.StateDump.EVENT_NAME,
        //     () => {},
        // );
    }

    /**
     * @override
     */
    protected __createOperatorPlayer(desc: Player.CtorArgs): OperatorPlayer<S> {
        return new OperatorPlayer(this, desc);
    }

    /**
     * @override
     */
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
Object.freeze(ClientGame);
Object.freeze(ClientGame.prototype);
