import * as io from "socket.io-client";

import { Events } from "src/Events";
import { BarePos, Tile } from "src/base/Tile";
import { VisibleTile } from "src/offline/VisibleTile";
import { Grid, Game } from "src/base/Game";
import { NonPrivilegedSettings } from "src/settings/GameSettings";

/**
 * 
 * 
 * @extends Game
 */
export class ClientGame extends Game {

    protected settings: NonPrivilegedSettings;

    public readonly socket: SocketIOClient.Socket;

    public constructor(sessionNamespace: string, height: number, width: number = height) {
        super(height, width);

        const serverUrl: string = null; // TODO
        this.socket = io.connect(`${serverUrl}${sessionNamespace}`);

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
        Grid.prototype.reset.call(this);
    }

    /**
     * @override {@link Grid#createTile}
     */
    public createTile(x: number, y: number): VisibleTile {
        return new VisibleTile(x, y);
    }

    /**
     * Normally calls {@link Game#processMoveExecute}. However, here,
     * this should be done as a callback to an event created by the server.
     * 
     * @override {@link Game#processMoveRequest}
     * @throws `TypeError` Unconditionally.
     */
    public processMoveRequest(playerId: number, dest: Tile | BarePos): never {
        throw new TypeError("This operation unsupported for the ClientGame class.");
    }

}
