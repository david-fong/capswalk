
/**
 *
 */
export class SnakeyServer { }
export namespace SnakeyServer {
    export const DEFAULT_PORT = 8080;
    /**
     * This is placed in this file so that it gets bundled into both the
     * client and the server code, which both require access to it.
     */
    export const enum Nsps {
        GROUP_LOBBY     = "/group",
        GROUP_JOINER    = "/joiner",
    }
}
Object.freeze(SnakeyServer);
Object.freeze(SnakeyServer.prototype);


/**
 *
 */
export class GroupSession { }
export namespace GroupSession {

    /**
     * An extension of {@link io.Socket}. It is very convenient to tack
     * these fields directly onto the socket objects.
     */
    export type Socket = Socket.ClientSide | Socket.ServerSide;
    export namespace Socket {
        type Base = {
            username?: string;
            teamId?: number; // These input values can be messy and non-continuous. They will be cleaned later.
            updateId: number; // initial value = 0
        };
        export type ServerSide = Base & import("socket.io").Socket;
        export type ClientSide = Base & typeof io.Socket;
    }

    export type GroupNspsName = string;
    export namespace GroupNspsName {
        /**
         * @see Player.Username.REGEXP
         */
        export const REGEXP = /[a-zA-Z](?:[a-zA-Z0-9:-]+?){4,}/;
    }

    export const enum RoomNames {
        MAIN = "main",
    }

    export class CtorArgs {

        public static EVENT_NAME = <const>"group-create";

        public static DEFAULT_INITIAL_TTL = <const>60;

        /**
         * The client should set this to a string to use as a group
         * name. They should try to satisfy {@link SessionName.REGEXP},
         * although that is not mandatory.
         */
        public groupName: GroupNspsName;

        /**
         * An empty string is allowed.
         */
        public readonly passphrase: string;

        /**
         * The Server should ignore any value set here by the client.
         *
         * The Server should respond to the client setting this value
         * to an approximate number of _seconds_ before the created
         * {@link GroupSession} will decide it was abandoned at birth
         * and get cleaned up (if nobody connects to it in that time).
         *
         * If the request was rejected, the client should ignore any
         * value set here by the Server.
         */
        public initialTtl: number;

        public constructor(
            groupName: GroupNspsName,
            passphrase: string,
            initialTtl: number = CtorArgs.DEFAULT_INITIAL_TTL
        ) {
            this.groupName = groupName;
            this.passphrase = passphrase;
            this.initialTtl = initialTtl;
        }
    };
    export namespace CtorArgs {
        export const GroupNspsNameMaxLength = 30;
        export const PassphraseMaxLength = 30;
    }
}
Object.freeze(GroupSession);
Object.freeze(GroupSession.prototype);
