import { Game } from "game/Game";

import type { Coord, Tile } from "floor/Tile";
import type { Player as __Player } from "defs/TypeDefs";
import type { ArtificialPlayer } from "./ArtificialPlayer";
import type { GameBase } from "game/__gameparts/Base";

import { PlayerActionEvent } from "game/events/PlayerActionEvent";
import { PlayerSkeleton } from "./PlayerSkeleton";
import { PlayerStatus } from "./PlayerStatus";
import { Team } from "./Team";

export { PlayerSkeleton };
export { PlayerStatus };
export { Team };


/**
 *
 */
export class Player<S extends Coord.System> extends PlayerSkeleton<S> {

    public readonly familyId: Player.Family;

    public readonly teamId: Team.Id;

    public readonly username: Player.Username;

    public lastAcceptedRequestId: number;

    public requestInFlight: boolean;


    public constructor(game: GameBase<any,S>, desc: Player.CtorArgs) {
        super(game, desc);

        if (!(Player.Username.REGEXP.test(desc.username))) {
            throw new RangeError(`Username \"${desc.username}\"`
            + ` does not match the required regular expression,`
            + ` \"${Player.Username.REGEXP.source}\".`
            );
        }
        this.familyId = desc.familyId;
        this.teamId   = desc.teamId;
        this.username = desc.username;
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
    protected makeMovementRequest(dest: Tile<S>, type: Player.MoveType): void {
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
                type,
            ),
        );
    }

    public get team(): Team<S> {
        return this.game.teams[this.teamId];
    }

    public isTeamedWith(other: Player<S>): boolean {
        return this.team.members.includes(other);
    }

}



export namespace Player {

    export type Family = __Player.Family;
    export type FamilyArtificial = Exclude<Player.Family, typeof Player.Family.HUMAN>;

    export type Id = __Player.Id;

    export type SocketId = string;

    /**
     * Health be picked up from the floor where it is randomly spawned
     * by the game manager. It can be used to attack enemy players, or
     * to heal teammates.
     */
    export type Health = __Player.Health;

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

    export type MoveType = __Player.MoveType;

    /**
     * # Player Constructor Arguments
     */
    export type CtorArgs = __CtorArgs<Player.Family>;
    export type __CtorArgs<F_group extends Player.Family> = any extends F_group ? never
    : { [F in F_group]: F extends Player.Family
        ? (CtorArgs.__PreIdAssignment<F> & Readonly<{
            playerId: Player.Id;
        }>)
        : never
    }[F_group];

    export namespace CtorArgs {

        export type PreIdAssignment = __PreIdAssignment<Player.Family>;
        export type __PreIdAssignment<F_group extends Player.Family> = any extends F_group ? never
        : { [F in F_group]: F extends Player.Family
            ? (Readonly<{
                isALocalOperator: F extends typeof Player.Family.HUMAN ? boolean : false;
                familyId: F;
                teamId:   Team.Id;
                socketId: F extends typeof Player.Family.HUMAN ? (SocketId | undefined) : undefined;
                username: Username;
                noCheckGameOver: boolean;
                familyArgs: FamilySpecificPart<F>;
            }>)
            : never;
        }[F_group];

        export type FamilySpecificPart<F extends Player.Family> =
        ( F extends typeof Player.Family.HUMAN ? {}
        : ArtificialPlayer.FamilySpecificPart<F>
        );

        /**
         * @returns
         * Squashes teamId fields to be suitable for array indices.
         *
         * @param playerDescs -
         * @param langName -
         */
        export const finalize = (
            playerDescs: TU.RoArr<CtorArgs.PreIdAssignment>,
        ): TU.RoArr<CtorArgs> => {
            // Map team ID's to consecutive numbers
            // (to play nice with array representations):
            const teamIdCleaner: TU.RoArr<Team.Id>
                = Array.from(new Set(playerDescs.map((player) => player.teamId)))
                .sort((a, b) => a - b)
                .reduce((prev, originalId, squashedId) => {
                    prev[originalId] = squashedId;
                    return prev;
                }, [] as Array<Team.Id>);
            return playerDescs.slice()
            .sort((pda, pdb) => teamIdCleaner[pda.teamId] - teamIdCleaner[pdb.teamId])
            .map<CtorArgs>((playerDesc, index) => { return {
                playerId:   index,
                familyId:   playerDesc.familyId,
                teamId:     teamIdCleaner[playerDesc.teamId],
                socketId:   playerDesc.socketId,
                username:   playerDesc.username,
                noCheckGameOver: playerDesc.noCheckGameOver,
                familyArgs: playerDesc.familyArgs,
            } as CtorArgs; });
        };
    }
    Object.freeze(CtorArgs);
}
Object.freeze(Player);
Object.freeze(Player.prototype);
