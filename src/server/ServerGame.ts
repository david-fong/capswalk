import * as app     from "express";
import * as http    from "http";
import * as io      from "socket.io";
import { Pos } from "src/base/Tile";
import { Game, PlayerMovementEvent, GameStateDump } from "src/base/Game";
import { ServerTile } from "src/server/ServerTile";
import { EventNames, SocketIoNamespaces } from "src/EventNames";

/**
 * 
 * 
 * @extends Game
 */
export class ServerGame extends Game {

    protected readonly port: number;

    protected readonly app:  app.Application;
    protected readonly http: http.Server;
    protected readonly io:   io.Server;

    protected readonly namespaces: Record<SocketIoNamespaces, io.Namespace>;

    protected readonly hostPwd: string;

    /**
     * 
     * @param port - The port number on which to host the Server.
     * @param height -  Vertical dimension of the grid to create.
     * @param width - Horizontal dimension of the grid to create. Defaults to `height`.
     */
    public constructor(port: number, height: number, width: number = height) {
        super(height, width);
        this.port   = port;
        this.app    = app();
        this.http   = http.createServer(this.app);
        this.io     = io(this.http);
        this.hostPwd = __dirname;

        this.http.listen(this.port, (): void => {
            console.log(`Now listening on port *:${this.port}.`);
        });

        this.app.get("/", (req, res) => {
            res.sendFile(`${__dirname}/index.html`);
        });

        /**
         * Interactions with clients under the `root` namespace.
         */
        this.namespaces[SocketIoNamespaces.ROOT] = this.io
            .of(SocketIoNamespaces.ROOT)
            .on("connection", this.onConnect);

        this.reset();
    }

    /**
     * 
     * @param socket - 
     */
    protected onConnect(socket: io.Socket): void {
        console.log("A user has connected.");
        socket.emit(EventNames.ASSIGN_PLAYER_ID, this.allocatePlayerId());

        socket.on("disconnect", (...args: any[]): void => {
            ;
        });

        socket.on(
                EventNames.PLAYER_MOVEMENT,
                (playerId: number, destPos: Pos): void => {
            // TODO: make socket have playerId field?
            this.processMoveRequest(playerId, destPos);
        });
    }

    public reset(): void {
        super.reset();
        this.namespaces[SocketIoNamespaces.ROOT]
            .emit(EventNames.DUMP_GAME_STATE, new GameStateDump());
    }

    /**
     * @override {@link Grid#createTile}
     */
    public createTile(x: number, y: number): ServerTile {
        return new ServerTile(x, y);
    }



    /**
     * Called automatically by {@link ServerGame#processMoveRequest}.
     * 
     * @override {@link Game#processMoveExecute}
     */
    protected processMoveExecute(desc: PlayerMovementEvent): void {
        super.processMoveExecute(desc);

        // Emit an event-notification to all clients.
        this.namespaces[SocketIoNamespaces.ROOT].emit(EventNames.PLAYER_MOVEMENT, {
            // TODO
        });
    }



    protected allocatePlayerId(): number {
        return -1; // TODO
    }

}
