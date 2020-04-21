import type { Lang } from "lang/Lang";
import type { Coord, Tile } from "floor/Tile";
import type { Player } from "game/player/Player";
import { EventRecordEntry, PlayerGeneratedRequest } from "./EventRecordEntry";


export type TileModificationEvent<S extends Coord.System> = {
    readonly coord: Coord.Bare<S>;

    /**
     * The requester should set this field to the highest value they
     * received from any previous responses from the server. In normal
     * cases (no message reordering), this should be equal to the last
     * value seen in the response from the server.
     *
     * The server should respond with the increment of this value. A
     * movement event causes a shuffle-in at the destination position,
     * which can affect whether another player intending to move to
     * the same position can do so. For this reason, the server should
     * reject requests where the requester has not received changes
     * involving a shuffle-in at their desired destination. This is
     * not mandatory, but preferred behaviour.
     */
    lastKnownUpdateId: number;

    newFreeHealth?: Player.Health;

    /**
     * Any value assigned by the requester to this field should be
     * ignored by the server.
     *
     * The server must set this to describe the new values to be
     * shuffled-in to the destination tile. It may set the field
     * to `undefined` if it wants to leave the CSP unchanged.
     */
    newCharSeqPair?: Lang.CharSeqPair;
};



export namespace PlayerActionEvent {

    /**
     * This is the agreed upon value that both the server and client
     * copies of a game should set as the initial value for request id
     * counters. Remember that a request ID is a property of a player,
     * whereas an event ID is a property tied to a game.
     */
    export const INITIAL_REQUEST_ID = -1;

    export const EVENT_NAME = Object.freeze(<const>{
        Bubble:   "player-bubble"  ,
        Movement: "player-movement",
    });


    /**
     *
     */
    export class Bubble implements PlayerGeneratedRequest {

        public eventId: number = EventRecordEntry.EVENT_ID_REJECT;

        public readonly playerId: Player.Id;

        /**
         * @see Player#lastAcceptedRequestId
         */
        public playerLastAcceptedRequestId: number;

        public affectedNeighbours?: TU.RoArr<{
            readonly playerId: Player.Id;
            readonly newHealth: Player.Health;
        }> = undefined;

        public constructor(
            playerId: Player.Id,
            lastAcceptedRequestId: number,
        ) {
            this.playerId = playerId;
            this.playerLastAcceptedRequestId = lastAcceptedRequestId;
        }
    }


    /**
     * ## Player Movement Event
     *
     * This single method-less class carries the bare-minimum information
     * needed to describe a client's request for movement to the server,
     * and to broadcast an acceptance of the request describing all changes
     * to the game state that must be made (or to otherwise direct-reply
     * the requester in case of request-rejection).
     *
     * It must do so in a way that allows the server and clients to infer
     * whether any message reordering occurred.
     *
     * ### The Problem in Summary
     *
     * - Client copies of the game should lag behind the master copy of
     *   the game state as little as possible with as small of a choking
     *   effect on a client's ability to send requests as possible. This
     *   rules out doing periodic game-state-dump broadcasts (because of
     *   the transmission delay), and "big-locks" requiring a client to
     *   have a completely up-to-date copy of the game state to have its
     *   requests processed.
     * - Nothing should ever happen in the client copies of the game that
     *   doesn't happen in the master copy at the server. Ie. Since game-
     *   state-dumps are out of the question, any corruption / de-sync of
     *   the client's copy of the game is considered fatal and completely
     *   unrecoverable.
     * - As a bonus, it would be nice to bake in a mechanism to prevent
     *   malicious or unintended spam from a trigger-happy client without
     *   excessively / unnecessarily throttling the request-making ability
     *   or throughput of any clients.
     */
    export class Movement<S extends Coord.System> extends Bubble {

        /**
         * Any value assigned by the requester to this field should be
         * ignored by the server. The server should respond with the new
         * values taken on by the player for these fields.
         */
        public newPlayerHealth?: {
            score:     Player.Health;
            health: Player.Health;
        } = undefined;

        public readonly dest: TileModificationEvent<S>;

        public tilesWithHealthUpdates?: TU.RoArr<TileModificationEvent<S>> = undefined;

        public constructor(
            playerId: Player.Id,
            lastAcceptedRequestId: number,
            destTile: Tile<S>,
        ) {
            super(playerId, lastAcceptedRequestId);
            this.dest = {
                coord:              destTile.coord,
                lastKnownUpdateId:  destTile.lastKnownUpdateId,
                newCharSeqPair:     undefined,
                newFreeHealth:      undefined,
            };
        }
    }

}
Object.freeze(PlayerActionEvent);
