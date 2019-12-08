import { Pos, Tile } from "src/base/Tile";
import { Game } from "src/base/Game";
import { PlayerMovementEvent } from "src/events/PlayerMovementEvent";
import { PlayerSkeleton } from "src/base/player/PlayerSkeleton";


/**
 * 
 */
export abstract class Player extends PlayerSkeleton {

    /**
     * The `x` and `y` coordinates could be any arbitrary value as long
     * as they are outside the range of valid {@link Grid} dimensions.
     */
    public static readonly BENCH_POS: Pos = new Pos(Infinity, Infinity);


    public readonly username: Player.Username;

    /**
     * See {@link Player#isOnATeamWith} for what qualifies a teammate
     * relationship between two players, and the {@link Bubble} module
     * documentation for explanations of the consequences / effects of
     * such a relationship (or lack thereof) on how those players are
     * intended to interact by the design of the game's objective and
     * mechanics. An empty collection indicates that the player is not
     * ony any team.
     * 
     * It must be checked that in the context of all players in a game,
     * at least one of the following is true, or else there will be a
     * player that cannot be permanently downed, and the game cannot
     * end:
     * - There exists a human-operated player that is not on any team.
     * - No single player is on every human team.
     * - There exists an artificial player that can down human players,
     *   and any player that is on every human team is not on that
     *   artificial player's team.
     * 
     * The ordering of entries is not meaningful, and duplicated values
     * are removed during construction.
     * 
     * These are fixed once the enclosing Game has been constructed.
     * To change these values, a new Game must be constructed.
     */
    public readonly teamSet: ReadonlyArray<Player.TeamNumber>;

    public lastAcceptedRequestId: number;

    public requestInFlight: boolean;

    /**
     * Managed externally by the Game Manager. Here for composition.
     */
    public bubbleTimer: number | NodeJS.Timeout;



    public constructor(game: Game, desc: Readonly<Player.ConstructorArguments>) {
        super(game, desc.idNumber!);

        if (!(Player.Username.REGEXP.test(desc.username))) {
            throw new RangeError( `Username \"${desc.username}\"`
                + ` does not match the required regular expression,`
                + ` \"${Player.Username.REGEXP}\".`
            );
        }
        this.username = desc.username;

        // Set the `teamSet` field (first remove duplicate values; sorting is optional):
        this.teamSet = Array.from((new Set(desc.teamNumbers))).sort((a, b) => a - b);
        if (this.teamSet.some((teamNumber) => teamNumber !== Math.trunc(teamNumber))) {
            throw new RangeError(`Team numbers must all be integer values.`);
        }
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
    protected makeMovementRequest(dest: Tile): void {
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
    protected abstract abstractMakeMovementRequest(dest: Tile): void;

    /**
     * Conveniece method.
     */
    public bench(): void {
        this.makeMovementRequest(this.benchTile);
    }



    /**
     * @returns Whether this and the `other` player are on a team
     * with each other.
     * 
     * @param other - 
     */
    public isOnATeamWith(other: Player): boolean {
        // Note: if this is ever changed, make sure to add the "this"
        // argument if necessary. It currently is neither needed nor
        // passed.
        return this.teamSet.some((teamNumA) => {
            return other.teamSet.some((teamNumB) => teamNumA === teamNumB);
        });
    }

    public get pos(): Pos {
        return this.hostTile.pos;
    }



    public getNeighbouringTiles(radius: number = 1): Array<Tile> {
        return this.game.getNeighbouringTiles(this.pos, radius);
    }

    public getUNT(radius: number = 1): Array<Tile> {
        return this.game.getUNT(this.pos, radius);
    }

    public getNeighbours(radius: number = 1): Array<Player> {
        return this.game.getNeighbours(this.pos, radius);
    }

}



export namespace Player {

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
    export type Id = number;
    export namespace Id {
        export const NULL = 0;
    }

    /**
     * An integer value.
     * 
     * Strictly negative values correspond to teams for artificially
     * controlled players, where all those of the same type are on the
     * same team and on that team _only_. Those values are hard-coded
     * into implementations of the {@link ArtificialPlayer} class.
     * 
     * Positive values including zero are reserved for human-operated
     * players.
     */
    export type TeamNumber = number;

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

    export type ConstructorArguments = {
        idNumber: Id | undefined; // undefined for non-client-game ctor arg
        readonly teamNumbers: ReadonlyArray<TeamNumber>;
        readonly username: Username;
        readonly socketId?: string; // undefined for offline game
    };

}
