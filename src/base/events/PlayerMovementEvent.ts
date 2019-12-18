import { Lang } from "lang/Lang";
import { BarePos, Tile } from "floor/Tile";
import { Player } from "game/player/Player";
import { EventRecordEntry, PlayerGeneratedRequest } from "events/PlayerGeneratedRequest";

/**
 * ## One Fantastic Nightmare of a Problem to Solve
 * 
 * This single methodless class is the ship that carries this project
 * a thousand troubles. Its job is to carry the _bare minimum amount_
 * of information needed to describe a client / operator's request for
 * movement to the server, and to broadcast an acceptance of the request
 * to all clients describing all changes to the game state that need to
 * be made in response to that request (or to otherwise reply to the
 * requester saying that their request was rejected), and must do so in
 * a way that allows the server and clients to infer whether any message
 * reordering occurred.
 * 
 * This is my first time working with client-server interactions, and
 * I find myself face-to-face with a deliciously maddening problem: A
 * client's game state should, as a general trend, follow in the wake
 * of changes to the server's master copy of the game's state. At the
 * very beginning of the game, the server broadcasts a dump of the
 * game's initial state to all clients in that game. Afterwards, any
 * such dumping is not desirable: not only would it lack in elegance,
 * but it would take precious time, possibly enough to leave the dump
 * receiver in the same predicament of having missed updates.
 * 
 * Game state management has to be robust enough to detect and handle
 * requests that arrive out of order- both at the server side, and at
 * the client side as responses and updates arrive, and to synchronize
 * every possible outcome of what I am calling the _dreaded adversarial
 * scenario_. Using socket.io, if all clients immediately upgrade to
 * use websockets for their underlying transport, then it is safe to
 * assume that emits from the server will arrive to the clients in the
 * same order. But, there are no absolute guarantees that clients will
 * support this, so we have to design accordingly.
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
 *   state-dumps are out of the question, any corruption / desync of
 *   the client's copy of the game is considered fatal and completely
 *   unrecoverable.
 * - As a bonus, it would be nice to bake in a mechanism to prevent
 *   malicious or unintended spam from a trigger-happy client without
 *   excessively / unnecessarily throttling the request-making ability
 *   or throughput of any clients.
 *
 * ### The Dreaded Adversarial Scenario
 * 
 * ```txt
 * ---------------------------------
 * |  Server copy  |  Client copy  |
 * |---------------|---------------|
 * |    A  B  C    |    A  B  C    |
 * |       D       |       D       |
 * ---------------------------------
 * ```
 * 
 * Imagine that a moment in time, on both the server and client copies
 * of the game state, there is a player `p1` on tile `A`, and a player
 * `p2` on tile `D`.
 * 
 * 
 */
export class PlayerMovementEvent implements PlayerGeneratedRequest {

    public static readonly EVENT_NAME = "player-movement";

    /**
     * This is the agreed upon value that both the server and client
     * copies of a game should set as the initial value for request id
     * counters.
     */
    public static readonly INITIAL_REQUEST_ID = -1;

    public eventId: number = EventRecordEntry.REJECT;

    public readonly playerId: Player.Id;

    public lastAcceptedRequestId: number;

    /**
     * Any value assigned by the requester to this field should be
     * ignored by the server.
     * 
     * The server should respond with the new value of the requester's
     * score.
     */
    public playerScore?: number = undefined;

    /**
     * Any value assigned by the requester to this field should be
     * ignored by the server.
     * 
     * The server should respond with the new value of the requester's
     * stockpile.
     */
    public playerStockpile?: number = undefined;

    public readonly destPos: BarePos;

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
    public destNumTimesOccupied: number;

    /**
     * Any value assigned by the requester to this field should be
     * ignored by the server.
     * 
     * The server must set this to describe the new values to be
     * shuffled-in to the destination tile.
     */
    public newCharSeqPair?: Lang.CharSeqPair = undefined;

    public constructor(
        playerId: Player.Id,
        lastAccpectedRequestId: number,
        destTile: Tile,
    ) {
        this.playerId = playerId;
        this.lastAcceptedRequestId  = lastAccpectedRequestId;
        this.destPos = destTile.pos.asBarePos();
        this.destNumTimesOccupied = destTile.numTimesOccupied;
    }

}
