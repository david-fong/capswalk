
/**
 * 
 */
export namespace EventRecordEntry {

    export const REJECT = -1;

}

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
