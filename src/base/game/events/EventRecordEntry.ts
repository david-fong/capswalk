import { Player } from "game/player/Player";


/**
 *
 */
export interface EventRecordEntry {

    /**
     * A positive, integer-valued identifier for an event.
     *
     * Must be unique in its context.
     *
     * The request-maker should not set this field.
     *
     * The request validator should respond with this value either set
     * to a valid value as described above, or leave it as {@link REJECT}.
     */
    eventId: number;

}

/**
 * https://www.typescriptlang.org/docs/handbook/declaration-merging.html#merging-namespaces-with-classes-functions-and-enums
 */
export namespace EventRecordEntry {

    /**
     * The Game Manager should assign this value to the `eventId` field
     * of a request-type event to signal if a request has been rejected.
     * It is convenient to use as a default value.
     */
    export const REJECT = -1;

    /**
     * Use for conditional fields.
     */
    // TODO: use this. may need to change event defs to be non-classes.
    export const enum ReqExec {
        REQUEST = "request",
        EXECUTE = "execute",
    }

}

export interface PlayerGeneratedRequest extends EventRecordEntry {

    readonly playerId: Player.Id;

    /**
     * ### Client Request
     *
     * Requester sends this desc to the Game Manager with a value of
     * the ID of the last request it that the server _accepted_. This
     * naturally implies that a requester cannot send a new request to
     * the Game Manager until it has received the Game Manager's
     * response to the last request it made.
     *
     * ### Server Response
     *
     * If the server accepts the request, it must broadcast a response
     * with this field set to the incremented value.
     *
     * If it rejects this request, it must directly acknowledge its
     * receipt of the request (no need to broadcast to all clients)
     * with this field unchanged, which indicates a rejection of the
     * request.
     *
     * ### Handling Unexpected Values
     *
     * If the server / Game Manager receives a request with a value in
     * this field lower than the one it set in its last response to the
     * requester, this would mean that the requester didn't wait for a
     * response to its previous request, which it is not supposed to do.
     *
     * **Important:** If the above requirement is ever changed, (in
     * addition to other mechanisms I haven't reasoned through,) this
     * field's spec should change to require _all_ server responses to
     * have this field set to an incremented value, including rejects.
     *
     * The server should never receive a request with a value higher
     * than the one it provided in its last response to this requester
     * because it in charge of incrementing it- the client should only
     * change the value it sees to match the one from the server's
     * response.
     *
     * In both these cases, the server may throw an assertion error for
     * debugging purposes.
     */
    lastAcceptedRequestId: number;

};
