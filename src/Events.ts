
/**
 * Global definitions of event names and callback function signatures.
 * These will be enforced by non-callable verification functions that
 * will be flagged by the typescript parser if implementations diverge
 * from the difinitions here.
 * 
 * TODO: delete this please.
 */
export namespace Events {

    /**
     * {@link Server}
     * 
     * Create a game session from the gamehosts namespace.
     * Client initiates with no arguments.
     * Server responds with the name of the namespace of the new
     *      {@link GroupSession}, and its initial TTL (see
     *      {@link GroupSession.constructor}).
     */
    export namespace CreateSession {
        export const name = "create session";

        export interface Initiate {
            (ack: Acknowlege): void;
        };
        export interface Acknowlege {
            (): void;
        };
    }

    /**
     * Language change.
     */
    export namespace LanguageChange {
        export const name = "language change";

        export interface Initiate {
            (ack: Acknowlege): void;
        };
        export interface Acknowlege {
            (): void;
        };
    }

}
