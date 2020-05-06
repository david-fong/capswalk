import * as io from "socket.io";
import { setTimeout } from "timers";

import { Game } from "game/Game";
import { Coord, Tile } from "floor/Tile";
import { Grid } from "floor/Grid";
import { Player, PlayerStatus } from "game/player/Player";
import { ArtificialPlayer } from "game/player/ArtificialPlayer";

import { EventRecordEntry } from "game/events/EventRecordEntry";
import { PlayerActionEvent } from "game/events/PlayerActionEvent";

import { GameManager } from "game/__gameparts/Manager";


type G = Game.Type.SERVER;

/**
 * Handles game-related events and attaches listeners to each client
 * socket.
 */
export class ServerGame<S extends Coord.System> extends GameManager<G,S> {

    public readonly namespace: io.Namespace;

    /**
     * Entries indexed at ID's belonging to human-operated players
     * contain an `io.Socket` object. I could have made this a field
     * of the `Player` class, but it is only used for players of the
     * `HUMAN` family, which is designated by field and not by class.
     */
    protected readonly playerSockets: Readonly<Record<Player.Id, io.Socket>>;

    /**
     * @override
     */
    protected __getGridImplementation(coordSys: S): Grid.ClassIf<S> {
        return Grid.getImplementation(coordSys);
    }


    /**
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
        super(
            Game.Type.SERVER, {
            tileClass: Tile,
            playerStatusCtor: PlayerStatus,
            }, gameDesc,
        );
        this.namespace = namespace;

        {
            const playerSockets: Record<Player.Id, io.Socket> = {};
            gameDesc.playerDescs.forEach((playerDesc) => {
                if (playerDesc.familyId === Player.Family.HUMAN) {
                    if (!playerDesc.socketId) { throw new Error; }
                }
                // The below cast is safe because GameBase reassigns
                // `gameDesc.playerDescs` the result of `Player.finalize`.
                // (Otherwise, `playerDesc` would still be a
                // `Player.CtorArgs.PreIdAssignment`).
                playerSockets[(playerDesc as Player.CtorArgs).playerId]
                    = this.namespace.sockets[playerDesc.socketId!];
            });
            this.playerSockets = playerSockets;
        }

        const humanPlayers = this.players
        .filter((player) => player.familyId === Player.Family.HUMAN);

        // Attach event listeners / handlers to each socket:
        humanPlayers.map((player) => this.playerSockets[player.playerId])
        .forEach((socket) => {
            // Attach the movement request handler:
            socket.removeAllListeners(PlayerActionEvent.EVENT_NAME.Movement);
            socket.on(
                PlayerActionEvent.EVENT_NAME.Movement,
                this.processMoveRequest,
            );
            // Attach the bubble-making request handler:
            socket.removeAllListeners(PlayerActionEvent.EVENT_NAME.Bubble);
            socket.on(
                PlayerActionEvent.EVENT_NAME.Bubble,
                this.processBubbleRequest,
            );
            // TODO.impl pause-request handler:
        });

        // Pass on Game constructor arguments to each client:
        humanPlayers.forEach((player) => {
            gameDesc.playerDescs.forEach((playerDesc) => {
                (playerDesc.isALocalOperator as boolean) =
                (playerDesc.socketId === this.playerSockets[player.playerId].id);
            })
            this.playerSockets[player.playerId].emit(
                Game.CtorArgs.EVENT_NAME,
                gameDesc,
            );
        }, this);
    }

    /**
     * @override
     */
    public async reset(): Promise<void> {
        const superPromise = super.reset();
        // TODO.design Should we wait for ACK's from all clients before
        // enabling the privileged users' `stateBecomePlaying` buttons?
        this.namespace.emit(
            Game.Serialization.EVENT_NAME,
            this.serializeResetState(),
        );
        return superPromise;
    }

    /**
     * @override
     */
    protected __createOperatorPlayer(desc: Player.CtorArgs): never {
        throw new TypeError("This should never be called for a ServerGame.");
    }

    /**
     * @override
     */
    protected __createArtifPlayer(desc: Player.__CtorArgs<Player.FamilyArtificial>): ArtificialPlayer<S> {
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
    public executePlayerMoveEvent(desc: Readonly<PlayerActionEvent.Movement<S>>): void {
        super.executePlayerMoveEvent(desc);

        if (desc.eventId === EventRecordEntry.EVENT_ID_REJECT) {
            // The request was rejected- Notify the requester.
            this.playerSockets[desc.playerId].emit(
                PlayerActionEvent.EVENT_NAME.Movement,
                desc,
            );
        } else {
            // Request was accepted.
            // Pass on change descriptor to all clients:
            this.namespace.emit(
                PlayerActionEvent.EVENT_NAME.Movement,
                desc,
            );
        }
    }

    public executePlayerBubbleEvent(desc: Readonly<PlayerActionEvent.Bubble>): void {
        super.executePlayerBubbleEvent(desc);

        if (desc.eventId === EventRecordEntry.EVENT_ID_REJECT) {
            // The request was rejected- Notify the requester.
            this.playerSockets[desc.playerId].emit(
                PlayerActionEvent.EVENT_NAME.Bubble,
                desc,
            );
        } else {
            // Request was accepted.
            // Pass on change descriptor to all clients:
            this.namespace.emit(
                PlayerActionEvent.EVENT_NAME.Bubble,
                desc,
            );
        }
    }
}
Object.freeze(ServerGame);
Object.freeze(ServerGame.prototype);
