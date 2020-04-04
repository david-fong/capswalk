import { Game } from "game/Game";

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
export abstract class Player<S extends Coord.System> extends PlayerSkeleton<S> {

    public readonly username: Player.Username;

    public readonly teamId: Player.Team.Id;

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
        this.username = desc.username;
        this.teamId = desc.teamId;
        this.status = this.__createStatusObj();
    }

    public reset(spawnTile: Tile<S>): void {
        super.reset(spawnTile);
        this.status.reset();
        this.lastAcceptedRequestId = PlayerActionEvent.INITIAL_REQUEST_ID;
        this.requestInFlight = false;
    }

    protected __createStatusObj(): PlayerStatus<S> {
        return new PlayerStatus(this);
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
        this.__abstractMakeMovementRequest(dest);
    }

    /**
     * @param dest -
     */
    protected abstract __abstractMakeMovementRequest(dest: Tile<S>): void;

    public get team(): Player.Team<S> {
        return this.game.teams[this.teamId];
    }

    public isTeammate(other: Player<S>): boolean {
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

    export type Bundle<T> = PlayerTypeDefs.Bundle<T>;

    export namespace Bundle {
        export type Contents<T> = PlayerTypeDefs.Bundle.Contents<T>;
        export type Counts      = PlayerTypeDefs.Bundle.Counts;
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
     * # Player Constructor Arguments
     */
    export type CtorArgs = CtorArgs.PreIdAssignment & {
        readonly playerId: Player.Id;
    };

    export namespace CtorArgs {

        export type PreIdAssignment = {
            readonly username: Username;
            readonly socketId: SocketId;
            readonly teamId: Team.Id;
        };

        /**
         * @returns
         * Squashes teamId fields to be suitable for array indices.
         *
         * @param playerDescs -
         */
        export const finalizePlayerIds = (
            playerDescs: Bundle<CtorArgs.PreIdAssignment>
        ): Bundle<CtorArgs> => {
            // Map team ID's to consecutive numbers
            // (to play nice with array representations):
            const allTeamIds = playerDescs.values
                .flatMap((members) => members.map((member) => member.teamId));
            const teamIdSquasherMap: Record<Team.Id, Team.Id>
                = Array.from(new Set(allTeamIds))
                .reduce((prev, unSquashedId, index) => {
                    prev[unSquashedId] = index;
                    return prev;
                }, {});
            // Add the `playerId` field to each member descriptor:
            for (const [ family, familyMembers, ] of playerDescs.entries) {
                familyMembers.forEach((memberDesc, numberInFamily) => {
                    // Note for below casts: cast-off readonly.
                    (memberDesc.teamId as Player.Team.Id) = teamIdSquasherMap[memberDesc.teamId];
                    ((memberDesc as CtorArgs).playerId as Id) = {
                        family: family,
                        number: numberInFamily,
                    };
                });
            }
            return playerDescs as Bundle<CtorArgs>;
        };

    }

}
