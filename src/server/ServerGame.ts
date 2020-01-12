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
import { ArtificialPlayer } from "game/player/ArtificialPlayer";


type G = Game.Type.SERVER;

/**
 * Handles game-related events and attaches listeners to each client
 * socket.
 * 
 * @extends Game
 */
export class ServerGame<S extends Coord.System.GridCapable> extends Game<G,S> {

    public readonly namespace: io.Namespace;

    protected readonly playerIdToSocketMap: ReadonlyMap<Player.Id, io.Socket>;



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
        desc: Game.CtorArgs<G,S>,
    ) {
        // Start with a call to the super constructor:
        super(desc, Tile);

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
        /**
         * @inheritdoc
         * NOTE: this doc is just here to satisfy some linting warning condition.
         */
        function __assert(desc: Game.CtorArgs<any,S>):
            asserts desc is Readonly<Game.CtorArgs<Game.Type.CLIENT, S>>{
            // doesn't actually do any assertion :P
            (desc.gameType as Game.Type) = Game.Type.CLIENT;
        };
        __assert(desc);
        this.namespace = session.namespace;
        (desc.playerDescs.HUMAN)
            .forEach((playerDesc) => {
                (desc.operatorIndex as Player.Id) = playerDesc.playerId;
                this.namespace.sockets[playerDesc.socketId].emit(
                    Game.CtorArgs.EVENT_NAME,
                    desc,
                );
            },
            this,
        );

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
