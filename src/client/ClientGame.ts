import * as io from "socket.io-client";

import { Coord } from "floor/Coord";
import { VisibleTile } from "floor/VisibleTile";
import { LocalGameSettings } from "settings/GameSettings";
import { Grid } from "floor/Grid";
import { Game } from "game/Game";

import { Player } from "game/player/Player";
import { PuppetPlayer } from "game/player/PuppetPlayer";
import { OperatorPlayer } from "game/player/OperatorPlayer";
import { OnlineOperatorPlayer } from "./OnlineOperatorPlayer";

import { PlayerMovementEvent } from "game/events/PlayerMovementEvent";
import { Bubble } from "game/events/Bubble";


type G = Game.Type.CLIENT;

/**
 * 
 * 
 * @extends Game
 */
export class ClientGame<S extends Coord.System> extends Game<G,S> {

    protected settings: LocalGameSettings;

    public readonly socket: SocketIOClient.Socket;



    /**
     * _Calls Grid.reset for this composition (bypasses super)._
     * 
     * @param socket - 
     * @param desc - This should come from a Server event by the name
     *      {@link Game.ConstructorArguments.EVENT_NAME}.
     */
    public constructor(
        socket: SocketIOClient.Socket,
        desc: Game.CtorArgs<G,S>,
    ) {
        super(desc, VisibleTile);
        if (!this.operator) {
            throw new Error("The Operator for a ClientGame should be defined.");
        }
        this.settings = LocalGameSettings.getInstance();
        this.socket = socket;

        this.socket.off(PlayerMovementEvent.EVENT_NAME);
        this.socket.on(
            PlayerMovementEvent.EVENT_NAME,
            this.processMoveExecute
        );
        this.socket.off(Bubble.MakeEvent.EVENT_NAME);
        this.socket.on(
            Bubble.MakeEvent.EVENT_NAME,
            this.processBubbleMakeExecute,
        );
        this.socket.off(Bubble.PopEvent.EVENT_NAME);
        this.socket.on(
            Bubble.PopEvent.EVENT_NAME,
            this.processBubblePopExecute,
        );

        this.reset();
    }

    /**
     * @override
     */
    public reset(): void {
        // Bypass my direct parent's reset implementation.
        Grid.prototype.reset.call(this);

        // TODO: Wait for a GameStateDump from the ServerGame. Send ack.
        // this.socket.once(
        //     Game.StateDump.EVENT_NAME,
        //     () => {},
        // );
    }

    /**
     * @override
     */
    protected createOperatorPlayer(desc: Player.CtorArgs): OperatorPlayer<S> {
        return new OnlineOperatorPlayer(this, desc);
    }

    /**
     * @override
     */
    protected createArtifPlayer(desc: Player.CtorArgs): PuppetPlayer<S> {
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
    public processMoveRequest(desc: PlayerMovementEvent<S>): never {
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
    public processBubbleMakeRequest(desc: Bubble.MakeEvent): never {
        throw new TypeError("This operation unsupported for the ClientGame class.");
    }

}
