import * as io from "socket.io-client";

import { BarePos } from "src/Pos";
import { VisibleTile } from "src/offline/VisibleTile";
import { LocalGameSettings } from "src/settings/GameSettings";
import { GridDimensionDesc, Grid, Game } from "src/base/Game";

import { PlayerId } from "src/base/player/Player";
import { PuppetPlayer } from "src/base/player/PuppetPlayer";
import { HumanPlayer } from "src/base/player/HumanPlayer";
import { OnlineHumanPlayer } from "./OnlineHumanPlayer";

import { PlayerMovementEvent } from "src/events/PlayerMovementEvent";
import { Bubble } from "src/events/Bubble";

/**
 * 
 * 
 * @extends Game
 */
export class ClientGame extends Game {

    protected settings: LocalGameSettings;

    public readonly socket: SocketIOClient.Socket;

    public constructor(
        socket: SocketIOClient.Socket,
        dimensions: GridDimensionDesc,
    ) {
        super(dimensions);
        this.settings = LocalGameSettings.getInstance();
        this.socket = socket;

        this.socket.on(
            PlayerMovementEvent.EVENT_NAME,
            this.processMoveExecute
        );
        this.socket.on(
            Bubble.MakeEvent.EVENT_NAME,
            this.processBubbleMakeExecute,
        );
        this.socket.on(
            Bubble.PopEvent.EVENT_NAME,
            this.processBubblePopExecute,
        );
        // TODO: should this call reset? The other implementations
        // (Game Managers) do.
    }

    /**
     * @override
     */
    public reset(): void {
        // Bypass my direct parent's reset implementation.

        // TODO: do we even need the below call? We should be waiting
        // for a GameStateDump from the ServerGame, and sending it an
        // ack to say that we received it.
        Grid.prototype.reset.call(this);
    }

    /**
     * @override
     */
    public createTile(pos: BarePos): VisibleTile {
        return new VisibleTile(pos);
    }

    /**
     * @override
     */
    protected createOperatorPlayer(idNumber: PlayerId): HumanPlayer {
        return new OnlineHumanPlayer(this, idNumber, "username"); // TODO: make username a Player field
    }

    /**
     * @override
     */
    protected createArtifPlayer(idNumber: PlayerId): PuppetPlayer {
        return new PuppetPlayer(this, idNumber);
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
    public processMoveRequest(desc: PlayerMovementEvent): never {
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
