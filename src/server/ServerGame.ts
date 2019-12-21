import * as io from "socket.io";
import { setTimeout } from "timers";

import { Coord } from "floor/Coord";
import { Tile } from "floor/Tile";
import { Game } from "game/Game";
import { GroupSession } from "./GroupSession";
import { Player } from "game/player/Player";

import { EventRecordEntry } from "game/events/EventRecordEntry";
import { PlayerMovementEvent } from "game/events/PlayerMovementEvent";
import { Bubble } from "game/events/Bubble";


/**
 * Handles game-related events and attaches listeners to each client
 * socket.
 * 
 * @extends Game
 */
export class ServerGame<S extends Coord.System> extends Game<S> {

    public readonly namespace: io.Namespace;

    /**
     * @override The Server copy has no Operator.
     */
    public declare readonly operator: undefined;

    protected readonly playerIdToSocketMap: ReadonlyMap<Player.Id, io.Socket>;

    /**
     * @override
     */
    public get gameType(): Game.Type {
        return Game.Type.SERVER;
    }



    /**
     * _Calls reset recursively for this entire composition._
     * 
     * Attach listeners for requests to each socket.
     * 
     * Broadcasts constructor arguments to all clients.
     * 
     * @param session - 
     * @param desc - 
     */
    public constructor(
        session: GroupSession,
        desc: Game.CtorArgs<S, Player.SocketId>,
    ) {
        super(desc);
        // Setup the map from player ID's to socket ID's:
        // This is used to send messages to players by their player ID.
        const playerIdToSocketMap: Map<Player.Id, io.Socket> = new Map();
        for (const playerDesc of desc.playerDescs) {
            playerIdToSocketMap.set(
                playerDesc.idNumber!,
                this.namespace.sockets[playerDesc.socketId],
            );
        };
        this.playerIdToSocketMap = playerIdToSocketMap;
        if (this.operator) {
            throw new Error("The Operator for a ServerGame should always be undefined.");
        }
        this.namespace = session.namespace;

        // Attach event listeners / handlers to each socket:
        Object.values(session.sockets).forEach((socket: GroupSession.Socket) => {
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
        desc.playerDescs.forEach((playerDesc) => {
            desc.operatorIndex = playerDesc.idNumber;
            this.namespace.sockets[playerDesc.socketId].emit(
                Game.CtorArgs.EVENT_NAME,
                desc,
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
    public createTile(desc: Coord.Bare<S>): Tile<S> {
        return new Tile(this.coordSys, desc);
    }

    /**
     * @override
     */
    protected createOperatorPlayer(desc: Player.CtorArgs<Player.SocketId>): never {
        throw new TypeError("This should never be called for a ServerGame.");
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
    public processMoveExecute(desc: Readonly<PlayerMovementEvent>): void {
        super.processMoveExecute(desc);

        if (desc.eventId === EventRecordEntry.REJECT) {
            // The request was rejected- Notify the requester.
            (this.playerIdToSocketMap.get(desc.playerId)!).emit(
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
            (this.playerIdToSocketMap.get(desc.playerId)!).emit(
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
    protected processBubblePopExecute(desc: Readonly<Bubble.PopEvent>): void {
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
