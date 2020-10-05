import { Player } from 'defs/TypeDefs';

/**
 *
 */
export abstract class SkServer { }
export namespace SkServer {
    export const PROTOCOL = "http://";
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
Object.freeze(SkServer);
Object.freeze(SkServer.prototype);


/**
 *
 */
export abstract class Group { }
export namespace Group {

    /**
     * An extension of {@link io.Socket}. It is very convenient to tack
     * these fields directly onto the socket objects.
     */
    export type Socket = import("socket.io").Socket & {
        userInfo: Player.UserInfo;
    };
    export namespace Socket {

        export namespace UserInfoChange {
            /**
             * Client emits this with a descriptor of requested username and teamId.
             * Server broadcasts a response
             */
            export const EVENT_NAME = "group-lobby-user-info-change";

            /**
             */
            export type Req = Player.UserInfo;
            /**
             */
            export type Res = Record<Socket["id"], Player.UserInfo | undefined>;
        }
    }

    export type Name = string;
    export namespace Name {
        export const REGEXP = /(?:[a-zA-Z0-9:-]+)/;
        export const MaxLength = 30;
    }
    export type Passphrase = string;
    export namespace Passphrase {
        export const REGEXP = /(?:[a-zA-Z0-9:-]+)/;
        export const MaxLength = 30;
    }

    export const JoinerReconnectionAttempts = 2;
    export const DEFAULT_TTL = 60;

    export namespace Exist {
        export const EVENT_NAME = "group-exist";
        /**
         * Sent by the client to request the creation of a new group.
         *
         * Do not use this to request joining a group - That is done
         * by opening a socket to that group's namespace and putting
         * the passphrase in the request's query.
         */
        export class RequestCreate {
            public constructor(
                public readonly groupName: Name,
                public readonly passphrase: string,
            ) {}
        };
        export namespace RequestCreate {
            export const enum Response {
                OKAY = "okay",
                NOPE = "nope",
            };
        }
        /**
         * Initiated by the server to notify clients of the status of
         * existing groups.
         */
        export type NotifyStatus = RequestCreate.Response | {
            [groupNspsName : string]: Status;
        };
        export const enum Status {
            IN_LOBBY    = "in-lobby",
            IN_GAME     = "in-game",
            DELETE      = "delete",
        };
    }
}
Object.freeze(Group);
Object.freeze(Group.prototype);