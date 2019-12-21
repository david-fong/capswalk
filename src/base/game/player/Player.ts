import { Player as PlayerTypeDefs } from "typedefs/TypeDefs";

import { Coord, Tile } from "floor/Tile";
import { Game } from "game/Game";
import { PlayerMovementEvent } from "game/events/PlayerMovementEvent";
import { PlayerSkeleton } from "./PlayerSkeleton";

export { PlayerSkeleton } from "./PlayerSkeleton";


/**
 * 
 */
export abstract class Player<S extends Coord.System> extends PlayerSkeleton<S> {


    public readonly username: Player.Username;

    /**
     * Remember, just like in real life, being nice to someone isn't
     * inherently mutually reciprocal. Just because you choose to go
     * by rules that make you nice to someone doesn't mean they will
     * be nice back (and here, the point is that sometimes you give
     * without expecting nicety in return), and if you slap a nice
     * person in the face in bad humor, see if they're ever nice to
     * you again.
     * 
     * See the {@link Bubble} module documentation for explanations of
     * the consequences / effects of such a relationship (or lack
     * thereof) on how those players are intended to interact by the
     * design of the game's objective and mechanics.
     * 
     * It must be checked that in the context of all players in a game,
     * _at least one_ of the following is true, or else there will be a
     * player that cannot be permanently downed, and the game cannot
     * end:
     * - There exists an artificial player that can down human players.
     * - For every human-operated player, there exists another that is
     *   not nice to it.
     * 
     * These are fixed once the enclosing Game has been constructed.
     * To change these values, a new Game must be constructed.
     */
    public readonly beNiceTo: ReadonlyArray<Player.Id>;

    public lastAcceptedRequestId: number;

    public requestInFlight: boolean;

    /**
     * Managed externally by the Game Manager. Here for composition.
     */
    public bubbleTimer: number | NodeJS.Timeout;



    public constructor(game: Game<S>, desc: Readonly<Player.CtorArgs>) {
        super(game, desc.idNumber!);

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
    protected makeMovementRequest(dest: Tile<S>): void {
        if (this.requestInFlight) {
            throw new Error("Only one request should ever be in flight at a time.");
        }
        this.requestInFlight = true;
        this.abstractMakeMovementRequest(dest);
    }

    /**
     * Sends a descriptor of the movement request to the Game Manager.
     * 
     * **_Do not call this directly!_** Instead, make a call to the
     * {@link Player#makeMovementRequest} method, which calls this,
     * and performs relevant non-implementation-dependant operations
     * such as book-keeping for spam control.
     * 
     * Request should call functions with a flow that either short-
     * circuits, or terminates with a call to {@link Player#moveTo}.
     * 
     * @param dest - 
     * 
     * @throws `Error` if `dest` is occupied by another `Player`.
     */
    protected abstract abstractMakeMovementRequest(dest: Tile<S>): void;

    /**
     * Conveniece method.
     */
    public bench(): void {
        this.makeMovementRequest(this.benchTile);
    }



    public get pos(): Coord<S> {
        return this.hostTile.pos;
    }



    public getNeighbouringTiles(radius: number = 1): Array<Tile<S>> {
        return this.game.getNeighbouringTiles(this.pos, radius);
    }

    public getUNT(radius: number = 1): Array<Tile<S>> {
        return this.game.getUNT(this.pos, radius);
    }

    public getNeighbours(radius: number = 1): Array<Player<S>> {
        return this.game.getNeighbours(this.pos, radius);
    }

}


export namespace Player {

    export type SocketId = string;

    /**
     * An **integer value** used to uniquely identify `Player`s in the
     * same {@link Game} together. These are not meaningful to humans
     * playing the game- rather, they are for internal use. Values are
     * allocated by the Game Manager during game construction.
     * 
     * Values strictly less than {@link Player.Id.NULL} correspond to
     * {@link ArtificialPlayer}s, and values strictly greater than
     * {@link Player.Id.NULL} correspond to {@link HumanPlayer}s. The
     * value {@link Player.Id.NULL} is reserved to indicate that a
     * {@link Tile} is unoccupied.
     */
    export declare type Id = PlayerTypeDefs.Id;

    /**
     * An integer value.
     * 
     * Each implementation of the {@link ArtificialPlayer} class must
     * have an entry here.
     * 
     * Make sure not to define any overlapping value mappings. It seems
     * TypeScript doesn't statically check for that.
     */
    export const enum Operator {
        HUMAN = 0,
        CHASER,
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
     * Server should pass ID = Player.SocketId
     * Client should keep default of Player.Id
     */
    export type CtorArgs<ID_TYPE extends Player.Id | SocketId = Player.Id> = {

        readonly operatorClass: Operator;

        /**
         * Initially `undefined` for server and offline games. It will
         * already be defined for a client game by the server.
         */
        idNumber: ID_TYPE extends Player.Id ? (Player.Id | undefined) : undefined;

        readonly username: Username;

        /**
         * A set of socket ID's. Only defined for non-offline games.
         * 
         * **Important**: The builder of this field must enforce that
         * entries are unique (that there are no duplicates).
         */
        beNiceTo: ReadonlyArray<ID_TYPE>

        readonly socketId: ID_TYPE extends SocketId ? SocketId : undefined;
    };

}
