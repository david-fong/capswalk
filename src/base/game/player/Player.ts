import type { Coord, Tile } from "floor/Tile";
import type { Player as PlayerTypeDefs } from "utils/TypeDefs";

import { PlayerMovementEvent } from "game/events/PlayerMovementEvent";
import { PlayerSkeleton } from "./PlayerSkeleton";
import { PlayerStatus } from "./PlayerStatus";
import { Game } from "game/Game";

export { PlayerSkeleton };
export { PlayerStatus };


/**
 *
 */
export abstract class Player<S extends Coord.System> extends PlayerSkeleton<S> {

    public readonly username: Player.Username;

    public readonly teamId: Player.TeamId;

    public readonly status: PlayerStatus;

    public lastAcceptedRequestId: number;

    public requestInFlight: boolean;


    public constructor(game: Game<any,S>, desc: Readonly<Player.CtorArgs>) {
        super(game, desc.playerId);

        if (!(Player.Username.REGEXP.test(desc.username))) {
            throw new RangeError( `Username \"${desc.username}\"`
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
        this.lastAcceptedRequestId = PlayerMovementEvent.INITIAL_REQUEST_ID;
        this.requestInFlight = false;
    }

    protected __createStatusObj(): PlayerStatus {
        return new PlayerStatus();
    }


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

    public get teammates(): ReadonlyArray<Player<S>> {
        return this.game.teams[this.teamId];
    }

    public isTeammate(other: Player<S>): boolean {
        return this.teammates.includes(other);
    }

}



export namespace Player {

    export type Family = PlayerTypeDefs.Family;

    export type Id = PlayerTypeDefs.Id;

    export type TeamId = number;

    export type SocketId = string;

    /**
     * This is the adjusted form of `Health.Raw`. Done by linear scaling
     * to account for headcount ratios between teams. It should not be
     * used as a storage field in any representations or communications.
     */
    export type Health = PlayerTypeDefs.Health;
    export namespace Health {
        /**
         * The pure, unadjusted measure of a Player's health. It can
         * be picked up from the floor where it is randomly spawned by
         * the game manager. It can be used to attack enemy players, or
         * to heal teammates.
         */
        export type Raw = PlayerTypeDefs.Health.Raw;
    }

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
            readonly teamId: TeamId;
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
            const teamIdSquasherMap: Record<TeamId, TeamId>
                = Array.from(new Set(allTeamIds))
                .reduce((prev, unSquashedId, index) => {
                    prev[unSquashedId] = index;
                    return prev;
                }, {});
            // Add the `playerId` field to each member descriptor:
            for (const [ family, familyMembers, ] of playerDescs.entries) {
                familyMembers.forEach((memberDesc, numberInFamily) => {
                    // Note for below casts: cast-off readonly.
                    (memberDesc.teamId as Player.TeamId) = teamIdSquasherMap[memberDesc.teamId];
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
