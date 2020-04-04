import * as io from "socket.io-client";

import { Game } from "game/Game";

import { LocalGameSettings }    from "settings/GameSettings";
import { Coord, VisibleTile }   from "floor/VisibleTile";
import { VisibleGrid }          from "floor/VisibleGrid";

import type { Player }          from "game/player/Player";
import type { OperatorPlayer }  from "game/player/OperatorPlayer";
import { PuppetPlayer }         from "game/player/PuppetPlayer";
import { OnlineOperatorPlayer } from "./OnlineOperatorPlayer";

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
        super(Game.Type.CLIENT, VisibleTile, gameDesc);
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
            this.processBubbleMakeExecute,
        );

        this.reset();
    }

    /**
     * @override
     */
    public reset(): void {
        // TODO.design Bypass my direct parent's reset implementation.
        // Which parts? This is an old comment from way back when Game extended Grid :P

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
        return new OnlineOperatorPlayer(this, desc);
    }

    /**
     * @override
     */
    protected __createArtifPlayer(desc: Player.CtorArgs): PuppetPlayer<S> {
        return new PuppetPlayer(this, desc);
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
     * @throws `TypeError` Unconditionally.
     */
    public processMoveRequest(desc: PlayerActionEvent.Movement<S>): never {
        throw new TypeError("This operation unsupported for the ClientGame class.");
    }

    /**
     * Normally calls {@link Game#processBubbleMakeExecute}. However,
     * there, that should be done as a callback to an event created by
     * the server.
     *
     * @override
     * @throws `TypeError` Unconditionally.
     */
    public processBubbleMakeRequest(desc: PlayerActionEvent.Bubble): never {
        throw new TypeError("This operation unsupported for the ClientGame class.");
    }

}
