import { LangCharSeqPair } from "src/Lang";
import { BarePos, Tile } from "src/base/Tile";
import { PlayerId } from "src/base/Player";


/**
 * ## A Fantastic Nightmare of a Problem to Solve
 * 
 * This single methodless class is the ship that carries this project
 * a thousand troubles. Its job is to carry the bare minimum amount of
 * information needed to describe a client / operator's request for
 * movement to the server, and to broadcast an acceptance of the request
 * to all clients describing all changes to the game state that need to
 * be made in response to that request (or to otherwise reply to the
 * requester saying that their request was rejected). It must do so in
 * a way that allows the server and clients to infer message reordering
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
 * use websockets for the underlying transport, then it is safe to
 * assume that emits from the server will arrive to the clients in the
 * same order, but there are no absolute guarantees for this.
 * 
 * The problem can be summed up as so:
 * - Client copies of the game should lag behind the master copy of
 *   the game state as little as possible. This pretty much rules out
 *   mechanisms such as periodic game-state-dump broadcasts (because
 *   of the transmission delay), and "big-locks" requiring a client to
 *   have a completely up-to-date copy of the game state to have its
 *   requests processed.
 * - Nothing should ever happen in the client copies of the game that
 *   doesn't happen in the master copy at the server. Ie. Since game-
 *   state-dumps are out of the question, any corruption / desync of
 *   the client's copy of the game is considered fatal and completely
 *   unrecoverable.
 * 
 * As a bonus, it would be nice to bake in a mechanism to prevent spam
 * from a trigger-happy client without excessively / unnecessarily
 * throttling the request-making throughput of any clients.
 *
 * ### The Dreaded Adversarial Scenario
 * 
 * ```
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
export class PlayerMovementEvent {
    public readonly destPos: BarePos;
    public playerNewScore: number;
    public destNumTimesOccupied: number;
    public newCharSeqPair: LangCharSeqPair | null;
    public constructor(public readonly playerId: PlayerId, destTile: Tile) {
        this.destPos = destTile.pos;
        this.destNumTimesOccupied = destTile.numTimesOccupied;
    }
}
