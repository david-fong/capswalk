import * as io from "socket.io";
import { setTimeout } from "timers";

import { Coord, Tile } from "floor/Tile";
import { Grid } from "floor/Grid";
import { Game } from "game/Game";
import { Player } from "game/player/Player";

import { EventRecordEntry } from "game/events/EventRecordEntry";
import { PlayerMovementEvent } from "game/events/PlayerMovementEvent";
import { Bubble } from "game/events/Bubble";
import { ArtificialPlayer } from "game/player/ArtificialPlayer";


type G = Game.Type.SERVER;

/**
 * Handles game-related events and attaches listeners to each client
 * socket.
 *
 * @extends Game
 */
export class ServerGame<S extends Coord.System> extends Game<G,S> {

    public readonly namespace: io.Namespace;

    protected readonly socketBundle: Player.Bundle<io.Socket>;

    /**
     * @override
     */
    protected __getGridImplementation(coordSys: S): Grid.ClassIf<S> {
        return Grid.getImplementation(coordSys);
    }



    /**
     * _Calls reset recursively for this entire composition._
     *
     * Attach listeners for requests to each socket.
     *
     * Broadcasts constructor arguments to all clients.
     *
     * @param namespace -
     * @param gameDesc -
     */
    public constructor(
        namespace: io.Namespace,
        gameDesc: Game.CtorArgs<G,S>,
    ) {
        // Start with a call to the super constructor:
        super(Game.Type.SERVER, Tile, gameDesc);
        this.namespace = namespace;

        // TODO: initialize this.socketBundle

        // Attach event listeners / handlers to each socket:
        this.players.contents.HUMAN.map((player) => this.socketBundle.get(player.playerId))
        .forEach((socket) => {
            // Attach the movement request handler:
            socket.removeAllListeners(PlayerMovementEvent.EVENT_NAME);
            socket.on(
                PlayerMovementEvent.EVENT_NAME,
                this.processMoveRequest,
            );
            // Attach the bubble-making request handler:
            socket.removeAllListeners(Bubble.MakeEvent.EVENT_NAME);
            socket.on(
                Bubble.MakeEvent.EVENT_NAME,
                this.processBubbleMakeRequest,
            );
            // TODO: pause-request handler:
        });

        // Pass on Game constructor arguments to each client:
        (this.players.contents.HUMAN).forEach((player) => {
            (gameDesc.operatorIndex as unknown as Player.Id["number"]) = player.playerId.number;
            this.socketBundle.get(player.playerId).emit(
                Game.CtorArgs.EVENT_NAME,
                gameDesc,
            );
        }, this);

        this.reset();
    }

    /**
     * @override
     */
    public reset(): void {
        super.reset();
        // TODO: broadcast a gamestate dump to all clients
        // and wait for each of their acks before starting to
        // actually process their movement requests and making
        // any artificial players start moving.
    }

    /**
     * @override
     */
    protected createOperatorPlayer(desc: Player.CtorArgs): never {
        throw new TypeError("This should never be called for a ServerGame.");
    }

    /**
     * @override
     */
    protected createArtifPlayer(desc: Player.CtorArgs): ArtificialPlayer<S> {
        return ArtificialPlayer.of(this, desc);
    }



    public setTimeout(callback: VoidFunction, millis: number, ...args: any[]): NodeJS.Timeout {
        return setTimeout(callback, millis, args).unref();
    }

    public cancelTimeout(handle: NodeJS.Timeout): void {
        clearTimeout(handle);
    }

    /**
     * @override
     */
    public processMoveExecute(desc: Readonly<PlayerMovementEvent<S>>): void {
        super.processMoveExecute(desc);

        if (desc.eventId === EventRecordEntry.REJECT) {
            // The request was rejected- Notify the requester.
            this.socketBundle.get(desc.playerId).emit(
                PlayerMovementEvent.EVENT_NAME,
                desc,
            );
        } else {
            // Request was accepted.
            // Pass on change descriptor to all clients:
            this.namespace.emit(
                PlayerMovementEvent.EVENT_NAME,
                desc,
            );
        }
    }

    public processBubbleMakeExecute(desc: Readonly<Bubble.MakeEvent>): void {
        super.processBubbleMakeExecute(desc);

        if (desc.eventId === EventRecordEntry.REJECT) {
            // The request was rejected- Notify the requester.
            this.socketBundle.get(desc.playerId).emit(
                Bubble.MakeEvent.EVENT_NAME,
                desc,
            );
        } else {
            // Request was accepted.
            // Pass on change descriptor to all clients:
            this.namespace.emit(
                Bubble.MakeEvent.EVENT_NAME,
                desc,
            );
        }
    }

    /**
     * @override
     */
    public processBubblePopExecute(desc: Readonly<Bubble.PopEvent>): void {
        super.processBubblePopExecute(desc);

        if (desc.eventId === EventRecordEntry.REJECT) {
            throw new Error("This should never happen.");
        } else {
            // Request was accepted.
            // Pass on change descriptor to all clients:
            this.namespace.emit(
                Bubble.PopEvent.EVENT_NAME,
                desc,
            );
        }
    }

}
