import { Game } from "game/Game";

import type { Lang } from "lang/Lang";
import type { Coord, Tile } from "floor/Tile";
import type { Player as PlayerTypeDefs } from "utils/TypeDefs";
import type { GameBase } from "game/__gameparts/Base";

import { PlayerActionEvent } from "game/events/PlayerActionEvent";
import { PlayerSkeleton } from "./PlayerSkeleton";
import { PlayerStatus } from "./PlayerStatus";

export { PlayerSkeleton };
export { PlayerStatus };


/**
 *
 */
export class Player<S extends Coord.System> extends PlayerSkeleton<S> {

    public readonly familyId: Player.Family;

    public readonly teamId: Player.Team.Id;

    public readonly username: Player.Username;

    public readonly status: PlayerStatus<S>;

    public lastAcceptedRequestId: number;

    public requestInFlight: boolean;


    public constructor(game: GameBase<any,S>, desc: Readonly<Player.CtorArgs>) {
        super(game, desc.playerId);

        if (!(Player.Username.REGEXP.test(desc.username))) {
            throw new RangeError(`Username \"${desc.username}\"`
            + ` does not match the required regular expression,`
            + ` \"${Player.Username.REGEXP.source}\".`
            );
        }
        this.familyId = desc.familyId;
        this.teamId   = desc.teamId;
        this.username = desc.username;
        this.status   = new (this.game.__playerStatusCtor)(this);
    }

    public reset(spawnTile: Tile<S>): void {
        super.reset(spawnTile);
        this.status.reset();
        this.lastAcceptedRequestId = PlayerActionEvent.INITIAL_REQUEST_ID;
        this.requestInFlight = false;
    }

    public __abstractNotifyThatGameStatusBecamePlaying(): void {}
    public __abstractNotifyThatGameStatusBecamePaused():  void {}
    public __abstractNotifyThatGameStatusBecameOver():    void {}


    /**
     * Called automatically by {@link OperatorPlayer#seqBufferAcceptKey}
     * for {@link OperatorPlayer}s, and by a periodic callback for
     * {@link ArtificialPlayer}s. Handles behaviour common between all
     * implementations.
     *
     * @final
     * @param dest -
     * @throws Error if the game is over or paused.
     */
    protected makeMovementRequest(dest:Tile<S>): void {
        if (this.game.status !== Game.Status.PLAYING) {
            throw new Error("This is not a necessary precondition, but we're doing it anyway.");
        } else if (this.requestInFlight) {
            throw new Error("Only one request should ever be in flight at a time.");
        }
        this.requestInFlight = true;
        this.game.processMoveRequest(
            new PlayerActionEvent.Movement(
                this.playerId,
                this.lastAcceptedRequestId,
                dest,
            ),
        );
    }

    public get team(): Player.Team<S> {
        return this.game.teams[this.teamId];
    }

    public isTeamedWith(other: Player<S>): boolean {
        return this.team.members.includes(other);
    }

}



export namespace Player {

    export type Family = PlayerTypeDefs.Family;

    export type Id = PlayerTypeDefs.Id;

    export class Team<S extends Coord.System> {
        public readonly id: Team.Id;
        public readonly members: ReadonlyArray<Player<S>>;
        /**
         * Indicates the order (relative to other teams) in which this
         * team was to have all its members downed at the same time at
         * least once. Once a team is soft-eliminated, they can continue
         * playing as normal, but there is no going back. The game ends
         * when all teams but one have been soft-eliminated.
         *
         * A comparatively smaller value denotes having been soft-
         * eliminated at an earlier point in the game. The value zero
         * denotes _not-having-been-soft-eliminated-yet_.
         */
        public softEliminationOrder: number;
        public constructor(teamId: Team.Id, members: ReadonlyArray<Player<S>>) {
            this.id = teamId;
            this.members = members;
        }
        public reset(): void {
            this.softEliminationOrder = 0;
        }
    }
    export namespace Team {
        export type Id = number;
    }

    export type SocketId = string;

    /**
     * Health be picked up from the floor where it is randomly spawned
     * by the game manager. It can be used to attack enemy players, or
     * to heal teammates.
     */
    export type Health = PlayerTypeDefs.Health;

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
     * # Player Constructor Arguments
     */
    export type CtorArgs = CtorArgs.PreIdAssignment & Readonly<{
        playerId: Player.Id;
        langName: Lang.Names.Key,
    }>;

    export namespace CtorArgs {

        export type PreIdAssignment = Readonly<{
            /**
             * This determines which constructor function to use.
             */
            familyId: Player.Family;
            teamId:   Team.Id;
            socketId: SocketId;
            username: Username;
        }>;

        /**
         * @returns
         * Squashes teamId fields to be suitable for array indices.
         *
         * @param playerDescs -
         */
        export const finalize = (
            playerDescs: ReadonlyArray<CtorArgs.PreIdAssignment>,
            langName: Lang.Names.Key,
        ): ReadonlyArray<CtorArgs> => {
            // Map team ID's to consecutive numbers
            // (to play nice with array representations):
            const teamIdCleaner: ReadonlyArray<Team.Id>
                = Array.from(new Set(playerDescs.map((player) => player.teamId)))
                .sort((a, b) => a - b)
                .reduce((prev, originalId, squashedId) => {
                    prev[originalId] = squashedId;
                    return prev;
                }, [] as Array<Team.Id>);
            return (playerDescs as Array<CtorArgs.PreIdAssignment>)
            .sort((pda, pdb) => teamIdCleaner[pda.teamId] - teamIdCleaner[pdb.teamId])
            .map<CtorArgs>((playerDesc, index) => { return {
                playerId:   index,
                familyId:   playerDesc.familyId,
                teamId:     teamIdCleaner[playerDesc.teamId],
                socketId:   playerDesc.socketId,
                username:   playerDesc.username,
                langName:   langName,
            }; });
        };

    }
    Object.freeze(CtorArgs);

}
Object.freeze(Player.prototype);
