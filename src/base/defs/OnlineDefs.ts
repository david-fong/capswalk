
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
        GROUP_LOBBY_PREFIX  = "/group-",
        GROUP_JOINER        = "/joiner",
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
    export namespace Socket {
        type Base = {
            username?: string;
            teamId?: number; // These input values can be messy and non-continuous. They will be cleaned later.
            updateId: number; // initial value = 0
        };
        export type ServerSide = Base & import("socket.io").Socket;
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

        public constructor(
            groupName: GroupNspsName,
            passphrase: string,
        ) {
            this.groupName = groupName;
            this.passphrase = passphrase;
        }
    };
    export namespace CtorArgs {
        export const JoinerReconnectionAttempts = 2;
        export const GroupNspsNameMaxLength = 30;
        export const PassphraseMaxLength = 30;
        export const DEFAULT_TTL = 60;

        /**
         * The client uses this event name when requesting creation
         * of a new group.
         *
         * The server uses this event name to notify clients of the
         * life stage of existing groups.
         */
        export const EVENT_NAME = "group-exist";
        export const enum LifeStage {
            JOINABLE    = "JOINABLE",
            CLOSED      = "CLOSED",
            DELETE      = "DELETE",
        };
    }
}
Object.freeze(GroupSession);
Object.freeze(GroupSession.prototype);
