import { Player as PlayerTypeDefs } from "utils/TypeDefs";

import { Coord, Tile } from "floor/Tile";
import { Game } from "game/Game";
import { PlayerMovementEvent } from "game/events/PlayerMovementEvent";
import { PlayerSkeleton } from "./PlayerSkeleton";

export { PlayerSkeleton } from "./PlayerSkeleton";


/**
 * 
 */
export abstract class Player<S extends Coord.System.GridCapable> extends PlayerSkeleton<S> {


    public readonly username: Player.Username;

    // TODO: add a public instance field to access tiles relative to
    //  this player's position. See Grid.TileGetter

    /**
     * As in real life, nicity isn't inherently mutually reciprocal.
     * 
     * See the {@link Bubble} module documentation.
     * 
     * It must be checked that all players _can_ be permanently downed.
     * At least one of the following must be true:
     * - There exists an artificial player that can down human players.
     * - For every human-operated player, there exists another that is
     *   not nice to it.
     * 
     * These are fixed once the enclosing Game has been constructed.
     */
    // TODO: how about a rule that no more than ~75% of the players
    // may be nice to you? (don't count self, and round down)
    public readonly beNiceTo: ReadonlyArray<Player.Id>;

    public lastAcceptedRequestId: number;

    public requestInFlight: boolean;

    /**
     * Managed externally by the Game Manager. Here for composition.
     */
    public bubbleTimer: number | NodeJS.Timeout;


    public constructor(game: Game<any,S>, desc: Readonly<Player.CtorArgs>) {
        super(game, desc.playerId);

        if (!(Player.Username.REGEXP.test(desc.username))) {
            throw new RangeError( `Username \"${desc.username}\"`
                + ` does not match the required regular expression,`
                + ` \"${Player.Username.REGEXP.source}\".`
            );
        }
        this.username = desc.username;
        this.beNiceTo = desc.beNiceTo;
    }

    public reset(): void {
        super.reset();
        this.lastAcceptedRequestId = PlayerMovementEvent.INITIAL_REQUEST_ID;
        this.requestInFlight = false;
        this.game.cancelTimeout(this.bubbleTimer);
    }



    /**
     * Called automatically by {@link HumanPlayer#seqBufferAcceptKey}
     * for {@link HumanPlayer}s, and by a periodic callback for
     * {@link ArtificialPlayer}s.
     * 
     * @param dest - 
     */
    protected makeMovementRequest(dest: Player<S>["hostTile"]): void {
        if (this.requestInFlight) {
            throw new Error("Only one request should ever be in flight at a time.");
        }
        this.requestInFlight = true;
        this.abstractMakeMovementRequest(dest);
    }

    /**
     * Sends a descriptor of the movement request to the Game Manager.
     * 
     * Request should call functions with a flow that either short-
     * circuits, or terminates with a call to {@link Player#moveTo}.
     * 
     * @param dest -
     */
    protected abstract abstractMakeMovementRequest(dest: Player<S>["hostTile"]): void;

    /**
     * Convenience method.
     */
    public bench(): void {
        this.makeMovementRequest(this.benchTile);
    }

    public get isBenched(): boolean {
        return this.hostTile === this.benchTile;
    }

}



export namespace Player {

    export type SocketId = string;

    export type Operator = PlayerTypeDefs.Operator;

    /**
     * 
     */
    export type Id = PlayerTypeDefs.Id;

    export type Bundle<T> = PlayerTypeDefs.Bundle<T>;

    export namespace Bundle {
        export type Mutable<T> = PlayerTypeDefs.Bundle.Mutable<T>;
    }

    export type Username = string;

    export namespace Username {
        /**
         * The choice of this is somewhat arbitrary. This should be enforced
         * externally since player descriptors are passed to the constructor.
         * 
         * Requirements:
         * - Starts with a letter.
         * - No whitespace except for non-consecutive space characters.
         * - Must contain at least five non-space characters that are
         *      either letters, numbers, or the dash character.
         */
        export const REGEXP = /[a-zA-Z](?:[ ]?[a-zA-Z0-9:-]+?){4,}/;
    }

    /**
     * # Player Constructor Arguments
     * 
     * @template ID
     * Only set to Player.SocketId when the player roster is under construction.
     */
    export type CtorArgs = CtorArgs.FromGame<Player.Id> & {
        readonly playerId: Player.Id;
    };

    export namespace CtorArgs {

        export type FromGame<ID extends Player.Id | SocketId = SocketId> = {

            readonly username: Username;

            /**
             * A set of socket ID's. Only defined for non-offline games.
             * 
             * **Important**: The builder of this field must enforce that
             * entries are unique (that there are no duplicates).
             */
            readonly beNiceTo: ReadonlyArray<ID>

            readonly socketId: SocketId;
        };

        /**
         * @returns
         * Used at a point when player descriptions have settled and
         * no more players will be allowed to join or expected to leave
         * anymore. This assigns players ID's and translates the team
         * related fields to be in terms of player ID's rather than
         * socket IDs.
         * 
         * @param playerDescs -
         */
        export const finalizePlayerIds = (
            playerDescs: Bundle<CtorArgs.FromGame>
        ): Bundle<CtorArgs> => {
            const socketIdToPlayerIdMap: Record<SocketId,Player.Id> = {};
            for (const operatorClass in playerDescs) {
                Player.assertIsOperator(operatorClass);
                playerDescs[operatorClass].forEach((oldCtorArgs, intraClassId) => {
                    socketIdToPlayerIdMap[oldCtorArgs.socketId] = {
                        operatorClass,
                        intraClassId,
                    };
                });
            }
            return Object.keys(playerDescs).reduce<Bundle.Mutable<CtorArgs>>(
                (retValBuild, operatorClass, __currentIndex, __array) => {
                    Player.assertIsOperator(operatorClass);
                    retValBuild[operatorClass] = playerDescs[operatorClass]
                    .map<CtorArgs>((playerDesc) => {
                        return {
                            playerId: socketIdToPlayerIdMap[playerDesc.socketId],
                            username: playerDesc.username,
                            beNiceTo: playerDesc.beNiceTo.map((socketId) => socketIdToPlayerIdMap[socketId]),
                            socketId: playerDesc.socketId,
                        };
                    });
                    return retValBuild;
                }, {} as Bundle<CtorArgs>,
            );
        };

    }

}
