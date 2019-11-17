import * as io from "socket.io-client";

import { Events } from "src/Events";
import { BarePos } from "src/Pos";
import { VisibleTile } from "src/offline/VisibleTile";
import { LocalGameSettings } from "src/settings/GameSettings";
import { Grid, Game } from "src/base/Game";
import { PlayerMovementEvent } from "src/base/PlayerMovementEvent";

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
        dimensions: { height: number, width?: number, },
    ) {
        super(dimensions);
        this.settings = LocalGameSettings.getInstance();
        this.socket = socket;

        this.socket.on(
            Events.PlayerMovement.name,
            this.processMoveExecute
        );
    }

    /**
     * @override {@link Game#reset}
     */
    public reset(): void {
        // Bypass my direct parent's reset implementation.

        // TODO: do we even need the below call? We should be waiting
        // for a GameStateDump from the ServerGame, and sending it an
        // ack to say that we received it.
        Grid.prototype.reset.call(this);
    }

    /**
     * @override {@link Grid#createTile}
     */
    public createTile(pos: BarePos): VisibleTile {
        return new VisibleTile(pos);
    }

    /**
     * Normally calls {@link Game#processMoveExecute}. However, here,
     * this should be done as a callback to an event created by the
     * server.
     * 
     * @override {@link Game#processMoveRequest}
     * @throws `TypeError` Unconditionally.
     */
    public processMoveRequest(desc: PlayerMovementEvent): never {
        throw new TypeError("This operation unsupported for the ClientGame class.");
    }

}
