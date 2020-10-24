import type * as io from "socket.io";
import { setTimeout } from "timers";

import { JsUtils } from "defs/JsUtils";
import { GameEv, Group, GroupEv, SkServer } from "defs/OnlineDefs";
import { Game } from "game/Game";
import { Coord, Tile } from "floor/Tile";
import { Grid } from "floor/Grid";
import { Player, PlayerStatus } from "game/player/Player";

import { EventRecordEntry } from "game/events/EventRecordEntry";
import { PlayerActionEvent } from "game/events/PlayerActionEvent";

import { GamepartManager } from "game/gameparts/GamepartManager";

import { _INIT_BASIC_CLASS_REGISTRIES } from "game/GameBootstrap";
_INIT_BASIC_CLASS_REGISTRIES();


type G = Game.Type.SERVER;

/**
 * Handles game-related events and attaches listeners to each client
 * socket.
 */
export class ServerGame<S extends Coord.System> extends GamepartManager<G,S> {

    /**
     * @override
     */
    // @ts-expect-error : Redeclaring accessor as property.
    declare public currentOperator: undefined;

    public readonly namespace: io.Namespace;
    private readonly _groupHostClient: io.Client;
    private readonly socketListeners: Readonly<{[evName : string]: (...args: any[]) => void}>;

    private readonly _deleteExternalRefs: () => void;

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
    protected readonly playerSockets: ReadonlyMap<Player.Id, io.Socket>;

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
     * @param groupNsps -
     * @param gameDesc -
     */
    public constructor(args: {
        groupNsps: io.Namespace,
        passphrase: Group.Passphrase,
        groupHostClient: io.Client,
        deleteExternalRefs: () => void,
        gameDesc: Game.CtorArgs<G,S>,
    }) {
        // Start with a call to the super constructor:
        super(
            Game.Type.SERVER, {
            onGameBecomeOver: () => {},
            tileClass: Tile,
            playerStatusCtor: PlayerStatus,
            }, args.gameDesc,
        );
        this._groupHostClient = args.groupHostClient;
        this._deleteExternalRefs = args.deleteExternalRefs;
        JsUtils.instNoEnum (this as ServerGame<S>, ["operators", "_deleteExternalRefs"]);
        JsUtils.propNoWrite(this as ServerGame<S>, ["_groupHostClient", "_deleteExternalRefs"]);

        this.namespace = args.groupNsps.server.of(
            SkServer.Nsps.GROUP_GAME_PREFIX + args.groupNsps.name.replace(SkServer.Nsps.GROUP_LOBBY_PREFIX, "")
        ).use((socket, next) => {
            const handshake = socket.handshake;
            if (handshake.query.passphrase !== args.passphrase) {
                next(new Error("Incorrect passphrase"));
            };
            return next();
        });

        this.socketListeners = Object.freeze({
            [PlayerActionEvent.EVENT_NAME.MOVEMENT]: this.processMoveRequest.bind(this),
            [PlayerActionEvent.EVENT_NAME.BUBBLE]: this.processBubbleRequest.bind(this),
            // TODO.impl pause-request handler:
        });
        JsUtils.instNoEnum (this as ServerGame<S>, ["socketListeners"]);
        JsUtils.propNoWrite(this as ServerGame<S>, ["socketListeners"]);

        // Prepare for all group members to join the game namespace:
        const gameSockConnResolvers: Map<io.Client, () => void> = new Map();
        function onGameSockConn(gameSocket: io.Socket): void {
            gameSockConnResolvers.get(gameSocket.client)!();
            gameSockConnResolvers.delete(gameSocket.client);
        }
        Promise.all(Object.values(args.groupNsps.sockets).map((groupSocket) => {
            return new Promise((resolve, reject) => {
                gameSockConnResolvers.set(groupSocket.client, resolve);
                this.namespace.once("connect", onGameSockConn);
            });
        }))
        .then(() => this._greetGameSockets(args.groupNsps, args.gameDesc))
        .catch((reason) => { setImmediate(() => { throw reason; }); });

        // Tell all group members in the lobby to join the game namespace:
        args.groupNsps.emit(GroupEv.CREATE_GAME);
    }

    /**
     */
    private _greetGameSockets(
        groupNsps: io.Namespace,
        gameDesc: Game.CtorArgs<G,S>,
    ): void {
        // @ts-expect-error : RO=
        this.playerSockets
        // The below cast is safe because GameBase reassigns
        // `gameDesc.playerDescs` the result of `Player.finalize`.
        // (Otherwise, `playerDesc` would still be a
        // `Player.CtorArgs.PreIdAssignment`).
        = (gameDesc.playerDescs as Player.CtorArgs[])
            .filter((playerDesc) => playerDesc.familyId === Player.Family.HUMAN)
            .reduce<Map<Player.Id, io.Socket>>((build, playerDesc) => {
                if (playerDesc.clientId === undefined) {
                    console.log(playerDesc);
                    throw new Error("missing socket client for player " + playerDesc.playerId);
                }
                const gameSocket = Object.values(this.namespace.sockets)
                    .find((socket) => socket.client.id === playerDesc.clientId);
                if (gameSocket === undefined) throw new Error("never");
                build.set(playerDesc.playerId, gameSocket);
                return build;
            }, new Map());
        JsUtils.propNoWrite(this as ServerGame<any>, ["playerSockets"]);

        Promise.all(Object.values(this.namespace.sockets).map((socket) => {
            return new Promise((resolve, reject) => {
                socket.once(GameEv.RESET, () => {
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
            socket.on("disconnect", () => {
                if (Object.keys(socket.nsp.sockets).length === 1) {
                    this.terminate();
                    return;
                }
            });
            socket.on(GameEv.RETURN_TO_LOBBY, () => {
                if (socket.client === this._groupHostClient) {
                    this.statusBecomeOver();
                    socket.broadcast.emit(GameEv.RETURN_TO_LOBBY);
                } else {
                    socket.broadcast.emit(GameEv.RETURN_TO_LOBBY, socket.id);
                }
            });
            Object.entries(this.socketListeners).forEach(([evName, callback]) => {
                socket.on(evName, callback);
            });

            // Set `isALocalOperator` flags to match what this socket should see:
            gameDesc.playerDescs.forEach((playerDesc) => {
                // @ts-expect-error : RO=
                playerDesc.isALocalOperator = (playerDesc.clientId === socket.client.id);
            });
            socket.emit(GameEv.CREATE_GAME, gameDesc);
        });
    }

    /**
     * @override
     */
    public async reset(): Promise<void> {
        console.log("starting reset");

        // Be ready for clients to indicate readiness to unpause.
        Promise.all(Object.values(this.namespace.sockets).map((socket) => {
            return new Promise((resolve, reject) => {
                socket.once(GameEv.UNPAUSE, () => {
                    resolve();
                });
            });
        })).then(() => {
            this.statusBecomePlaying();
            this.namespace.emit(GameEv.UNPAUSE);
        });

        const superPromise = super.reset();
        await superPromise;

        this.namespace.emit(
            GameEv.RESET,
            this.serializeResetState(),
        );
        return superPromise;
    }

    /**
     * @override
     */
    public _createOperatorPlayer(desc: Player.CtorArgs): never {
        throw new TypeError("This should never be called for a ServerGame.");
    }
    /**
     * @override
     */
    public setCurrentOperator(nextOperatorIndex: number): void {
        // no-op
    }


    /**
     * @override
     */
    public setTimeout(callback: () => void, millis: number, ...args: any[]): NodeJS.Timeout {
        return setTimeout(callback, millis, args).unref();
    }

    /**
     * @override
     */
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
            this.playerSockets.get(desc.playerId)!.emit(
                PlayerActionEvent.EVENT_NAME.MOVEMENT,
                desc,
            );
        } else {
            // Request was accepted.
            // Pass on change descriptor to all clients:
            this.namespace.emit(
                PlayerActionEvent.EVENT_NAME.MOVEMENT,
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
            this.playerSockets.get(desc.playerId)!.emit(
                PlayerActionEvent.EVENT_NAME.BUBBLE,
                desc,
            );
        } else {
            // Request was accepted.
            // Pass on change descriptor to all clients:
            this.namespace.emit(
                PlayerActionEvent.EVENT_NAME.BUBBLE,
                desc,
            );
        }
    }

    private terminate(): void {
        Object.values(this.namespace.sockets).forEach((socket) => {
            socket.disconnect();
            socket.removeAllListeners();
        });
        this.namespace.removeAllListeners();
        this._deleteExternalRefs();
    }
}
JsUtils.protoNoEnum(ServerGame, [
    "_greetGameSockets",
    "_getGridImplementation",
    "_createOperatorPlayer", "setCurrentOperator",
]);
Object.freeze(ServerGame);
Object.freeze(ServerGame.prototype);