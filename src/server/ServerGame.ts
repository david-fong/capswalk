import type * as io from "socket.io";
import { setTimeout } from "timers";

import { Game } from "game/Game";
import { Coord, Tile } from "floor/Tile";
import { Grid } from "floor/Grid";
import { Player, PlayerStatus } from "game/player/Player";

import { EventRecordEntry } from "game/events/EventRecordEntry";
import { PlayerActionEvent } from "game/events/PlayerActionEvent";

import { GamepartManager } from "game/gameparts/GamepartManager";

import { GameBootstrap } from "game/GameBootstrap";
GameBootstrap.INIT_CLASS_REGISTRIES();


type G = Game.Type.SERVER;

/**
 * Handles game-related events and attaches listeners to each client
 * socket.
 */
export class ServerGame<S extends Coord.System> extends GamepartManager<G,S> {

    public readonly namespace: io.Namespace;

    /**
     * Entries indexed at ID's belonging to human-operated players
     * contain an `io.Socket` object. I could have made this a field
     * of the `Player` class, but it is only used for players of the
     * `HUMAN` family, which is designated by field and not by class.
     *
     * This does not update for players that join the group while the
     * group is already in a game, which is currently the intended
     * behaviour: players cannot join the game mid-game.
     */
    protected readonly playerSockets: TU.RoArr<io.Socket>;

    /**
     * @override
     */
    protected _getGridImplementation(coordSys: S): Grid.ClassIf<S> {
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
            onGameBecomeOver: () => {},
            tileClass: Tile,
            playerStatusCtor: PlayerStatus,
            }, gameDesc,
        );
        this.namespace = namespace;

        // The below cast is safe because GameBase reassigns
        // `gameDesc.playerDescs` the result of `Player.finalize`.
        // (Otherwise, `playerDesc` would still be a
        // `Player.CtorArgs.PreIdAssignment`).
        this.playerSockets = (gameDesc.playerDescs as Player.CtorArgs[])
        .filter((playerDesc) => playerDesc.familyId === Player.Family.HUMAN)
        .map((playerDesc) => {
            if (!playerDesc.socketId) {
                throw Error("missing socket ID for player " + playerDesc.playerId);
            }
            return this.namespace.sockets[playerDesc.socketId!];
        });

        // TODO.test wait for all sockets to signal ready for game reset.
        Promise.all(Object.values(this.namespace.sockets).map((socket) => {
            return new Promise((resolve, reject) => {
                socket.once(Game.CtorArgs.EVENT_NAME_CLIENT_READY_RESET, () => {
                    resolve();
                });
            });
        })).then(() => {
            this.reset();
        });

        // Pass on Game constructor arguments to each client:
        // We need to go by sockets since each client may be operating
        // upon (controlling) several of its own players.
        Object.values(this.namespace.sockets).forEach((socket) => {
            // Attach the movement request handlers:
            // (these are detached in `onReturnToLobby`).
            socket.on(
                PlayerActionEvent.EVENT_NAME.Movement,
                this.processMoveRequest.bind(this),
            );
            // Attach the bubble-making request handler:
            socket.on(
                PlayerActionEvent.EVENT_NAME.Bubble,
                this.processBubbleRequest.bind(this),
            );
            // TODO.impl pause-request handler:

            // Set `isALocalOperator` flags to match what this socket should see:
            gameDesc.playerDescs.forEach((playerDesc) => {
                (playerDesc.isALocalOperator as boolean) =
                (playerDesc.socketId === socket.id);
            });
            socket.emit(
                Game.CtorArgs.Event.NAME,
                gameDesc,
            );
        });
    }

    /**
     * @override
     */
    public async reset(): Promise<void> {
        console.log("starting reset");
        // TODO.test wait for all sockets to signal ready for game unpause.
        Promise.all(Object.values(this.namespace.sockets).map((socket) => {
            return new Promise((resolve, reject) => {
                socket.once(Game.CtorArgs.EVENT_NAME_CLIENT_READY_UNPAUSE, () => {
                    resolve();
                });
            });
        })).then(() => {
            this.namespace.emit(Game.CtorArgs.EVENT_NAME_SERVER_APPROVE_UNPAUSE);
        });
        const superPromise = super.reset();
        await superPromise;

        this.namespace.emit(
            Game.Serialization.EVENT_NAME,
            this.serializeResetState(),
        );
        return superPromise;
    }

    public onReturnToLobby(): void {
        Object.values(this.namespace.sockets).forEach((socket) => {
            socket.removeAllListeners(PlayerActionEvent.EVENT_NAME.Movement);
            socket.removeAllListeners(PlayerActionEvent.EVENT_NAME.Bubble);
        });
    }

    /**
     * @override
     */
    public _createOperatorPlayer(desc: Player.CtorArgs): never {
        throw TypeError("This should never be called for a ServerGame.");
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

    /**
     * @override
     */
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
