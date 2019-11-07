import { Application } from "express";
import { Server } from "http";
import { Game, PlayerMovementEvent } from "src/base/Game";
import { ServerTile } from "./ServerTile";

/**
 * 
 * 
 * @extends Game
 */
export class ServerGame extends Game {

    protected readonly port: number;
    protected readonly app:  Application;
    protected readonly http: Server;
    protected readonly io:   SocketIO.Server;

    protected readonly hostPwd: string;

    public constructor(port: number, height: number, width: number = height) {
        super(height, width);
        this.port   = port;
        this.app    = require("express")();
        this.http   = require("http").createServer(this.app);
        this.io     = require("socket.io")(this.http);

        this.hostPwd = __dirname;

        // TODO bind ::processMoveRequest to event notification from clients.

        this.app.get("/", (req, res) => {
            res.sendFile(`${__dirname}/index.html`);
        });

        this.io.on("connection", socket => {
            console.log("A user has connected.");
        });
          
        this.http.listen(this.port, () => {
            console.log(`Now listening on port *:${this.port}.`);
        });
    }

    public reset(): void {
        super.reset();

        // TODO: send the state of the grid, players, etc, to all clients.
    }

    /**
     * @implements `Grid::createTile`
     */
    public createTile(x: number, y: number): ServerTile {
        return new ServerTile(x, y);
    }

    /**
     * @implements `Game::processMoveExecute`
     */
    protected processMoveExecute(desc: PlayerMovementEvent): void {
        super.processMoveExecute(desc);
        // TODO: emit an event to all clients.
    }

}
