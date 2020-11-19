import { JsUtils } from "defs/JsUtils";
import { Game } from "game/Game";
import type * as io from "socket.io";

import type { Coord, Tile }     from "floor/Tile";
import type { Player as _Player } from "defs/TypeDefs";
import type { ArtificialPlayer } from "./ArtificialPlayer";
import type { GamepartBase }    from "game/gameparts/GamepartBase";
import type { Team }            from "./Team";

import { PlayerActionEvent }    from "game/events/PlayerActionEvent";
import { PlayerSkeleton }       from "./PlayerSkeleton";    export { PlayerSkeleton };
import { PlayerStatus }         from "./PlayerStatus";      export { PlayerStatus };


/**
 *
 */
export class Player<S extends Coord.System> extends PlayerSkeleton<S> implements _Player.UserInfo {

	public readonly familyId: Player.Family;

	public readonly teamId: Team.Id;

	public readonly username: Player.Username;

	public readonly avatar: Player.Avatar;

	public lastAcceptedRequestId: number;

	public requestInFlight: boolean;

	/**
	 */
	public constructor(game: GamepartBase<any,S>, desc: Player.CtorArgs) {
		super(game, desc);

		this.familyId = desc.familyId;
		this.teamId   = desc.teamId;
		this.username = desc.username;
		this.avatar   = desc.avatar ?? Player.Avatar.GET_RANDOM();
		JsUtils.propNoWrite(this as Player<S>, [
			"familyId", "teamId", "username", "avatar",
		]);
	}

	public reset(spawnTile: Tile<S>): void {
		super.reset(spawnTile);
		this.status.reset();
		this.lastAcceptedRequestId = PlayerActionEvent.INITIAL_REQUEST_ID;
		this.requestInFlight = false;
	}

	/**
	 * Overrides must call super.
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
		if (DEF.DevAssert) {
			if (this.game.status !== Game.Status.PLAYING) {
				throw new Error("This is not a necessary precondition, but we're doing it anyway.");
			} else if (this.requestInFlight) {
				throw new Error("Only one request should ever be in flight at a time.");
			}
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
	export type UserInfo = _Player.UserInfo;

	export type MoveType = _Player.MoveType;

	/**
	 * # Player Constructor Arguments
	 */
	export type CtorArgs = _CtorArgs<Player.Family>;
	export type _CtorArgs<FGroup extends Player.Family> = any extends FGroup ? never
	: { [F in FGroup]: F extends Player.Family
		? (_PreIdAssignmentDict[F] & Readonly<{
			playerId: Player.Id;
		}>)
		: never
	}[FGroup];

	type _PreIdAssignmentConditional<F extends Player.Family> = Readonly<{
		isALocalOperator: F extends typeof Player.Family.HUMAN ? boolean : false;
		familyId: F;
		teamId:   Team.Id;
		clientId: F extends typeof Player.Family.HUMAN ? (io.Socket["client"]["id"] | undefined) : undefined;
		username: Username;
		avatar:   Avatar | undefined;
		noCheckGameOver: boolean;
		familyArgs: CtorArgs.FamilySpecificPart[F];
	}>;
	interface _PreIdAssignmentDict {
		[Player.Family.HUMAN ]: _PreIdAssignmentConditional<typeof Player.Family.HUMAN >;
		[Player.Family.CHASER]: _PreIdAssignmentConditional<typeof Player.Family.CHASER>;
	}

	export namespace CtorArgs {

		export type PreIdAssignment = _PreIdAssignmentDict[Player.Family];

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
		export function finalize(playerDescs: TU.RoArr<CtorArgs.PreIdAssignment>): TU.RoArr<CtorArgs> {
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
			.map<CtorArgs>((playerDesc, index) => Object.assign({}, playerDesc, {
				playerId:   index,
				teamId:     teamIdCleaner[playerDesc.teamId],
			}));
		};
	}
	Object.freeze(CtorArgs);
}
JsUtils.protoNoEnum(Player, [
	"_notifyGameNowPaused", "_notifyGameNowPlaying", "_notifyGameNowOver",
]);
Object.freeze(Player);
Object.freeze(Player.prototype);