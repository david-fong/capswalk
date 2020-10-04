import { Game } from "game/Game";

import type { Coord, Tile }     from "floor/Tile";
import type { Player as _Player } from "defs/TypeDefs";
import type { ArtificialPlayer } from "./ArtificialPlayer";
import type { GamepartBase }    from "game/gameparts/GamepartBase";

import { PlayerActionEvent }    from "game/events/PlayerActionEvent";
import { PlayerSkeleton }       from "./PlayerSkeleton";    export { PlayerSkeleton };
import { PlayerStatus }         from "./PlayerStatus";      export { PlayerStatus };
import { Team }                 from "./Team";              export { Team };


/**
 *
 */
export class Player<S extends Coord.System> extends PlayerSkeleton<S> {

    public readonly familyId: Player.Family;

    public readonly teamId: Team.Id;

    public readonly username: Player.Username;

    public readonly avatar: Player.Avatar;

    public lastAcceptedRequestId: number;

    public requestInFlight: boolean;


    public constructor(game: GamepartBase<any,S>, desc: Player.CtorArgs) {
        super(game, desc);

        this.familyId = desc.familyId;
        this.teamId   = desc.teamId;
        this.username = desc.username;
        this.avatar   = desc.avatar ?? Player.Avatar.GET_RANDOM();
    }

    public reset(spawnTile: Tile<S>): void {
        super.reset(spawnTile);
        this.status.reset();
        this.lastAcceptedRequestId = PlayerActionEvent.INITIAL_REQUEST_ID;
        this.requestInFlight = false;
    }

    /**
     * The default implementation does nothing.
     */
    public _notifyGameNowPlaying(): void { }
    /**
     * The default implementation does nothing.
     */
    public _notifyGameNowPaused(): void { }
    /**
     * The default implementation does nothing.
     */
    public _notifyGameNowOver(): void { }


    /**
     * Called automatically by {@link OperatorPlayer#seqBufferAcceptKey}
     * for {@link OperatorPlayer}s, and by a periodic callback for
     * {@link ArtificialPlayer}s. Handles behaviour common between all
     * implementations.
     *
     * @final
     * @param dest -
     * @throws A previous request is still in flight (unacknowledged).
     */
    protected makeMovementRequest(dest: Tile<S>, type: Player.MoveType): void {
        if (this.game.status !== Game.Status.PLAYING) {
            // TODO.build disable this check for production.
            throw Error("This is not a necessary precondition, but we're doing it anyway.");
        } else if (this.requestInFlight) {
            throw Error("Only one request should ever be in flight at a time.");
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

    export type Family = _Player.Family;
    export type FamilyArtificial = Exclude<Player.Family, typeof Player.Family.HUMAN>;

    export type Id = _Player.Id;

    export type SocketId = string;

    /**
     * Health be picked up from the floor where it is randomly spawned
     * by the game manager. It can be used to attack enemy players, or
     * to heal teammates.
     */
    export type Health = _Player.Health;

    export type Username = _Player.Username;
    export type Avatar   = _Player.Avatar;

    export type MoveType = _Player.MoveType;

    /**
     * # Player Constructor Arguments
     */
    export type CtorArgs = _CtorArgs<Player.Family>;
    export type _CtorArgs<F_group extends Player.Family> = any extends F_group ? never
    : { [F in F_group]: F extends Player.Family
        ? (_PreIdAssignment<F> & Readonly<{
            playerId: Player.Id;
        }>)
        : never
    }[F_group];

    type _PreIdAssignment<F_group extends Player.Family> = any extends F_group ? never
    : { [F in F_group]: F extends Player.Family
        ? (Readonly<{
            isALocalOperator: F extends typeof Player.Family.HUMAN ? boolean : false;
            familyId: F;
            teamId:   Team.Id;
            socketId: F extends typeof Player.Family.HUMAN ? (SocketId | undefined) : undefined;
            username: Username;
            avatar:   Avatar | undefined;
            noCheckGameOver: boolean;
            familyArgs: CtorArgs.FamilySpecificPart[F];
        }>)
        : never;
    }[F_group];

    export namespace CtorArgs {

        export type PreIdAssignment = _PreIdAssignment<Player.Family>;

        export interface FamilySpecificPart extends ArtificialPlayer.FamilySpecificPart {
            [Player.Family.HUMAN]: {};
        }

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
                .sort((a, b) => a - b) // This is not a representation requirement.
                .reduce((prev, originalId, squashedId) => {
                    prev[originalId] = squashedId;
                    return prev;
                }, [] as Array<Team.Id>);
            return playerDescs.slice()
            .sort((pda, pdb) => teamIdCleaner[pda.teamId] - teamIdCleaner[pdb.teamId])
            .map<CtorArgs>((playerDesc, index) => Object.assign(playerDesc, {
                playerId:   index,
                teamId:     teamIdCleaner[playerDesc.teamId],
            }));
        };
    }
    Object.freeze(CtorArgs);
}
Object.freeze(Player);
Object.freeze(Player.prototype);