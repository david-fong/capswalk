import { JsUtils } from "defs/JsUtils";
import { Game } from "game/Game";
import type * as io from "socket.io";

import type { Coord, Tile }     from "floor/Tile";
import type { Player as _Player } from "defs/TypeDefs";
import type { ArtificialPlayer } from "./ArtificialPlayer";
import type { GamepartBase }    from "game/gameparts/GamepartBase";
import type { Team }            from "./Team";

import { PlayerSkeleton } from "./PlayerSkeleton"; export { PlayerSkeleton };
import { PlayerStatus }   from "./PlayerStatus";import type { StateChange } from "base/game/StateChange";
 export { PlayerStatus };

/**
 */
export class Player<S extends Coord.System> extends PlayerSkeleton<S> implements _Player.UserInfo {

	public readonly familyId: Player.Family;
	public readonly teamId: Team.Id;
	public readonly username: Player.Username;
	public readonly avatar: Player.Avatar;
	public readonly reqBuffer: Player.RequestBuffer;

	/**
	 */
	public constructor(game: GamepartBase<any,S>, desc: Player.CtorArgs) {
		super(game, desc);

		this.familyId = desc.familyId;
		this.teamId   = desc.teamId;
		this.username = desc.username;
		this.avatar   = desc.avatar ?? Player.Avatar.GET_RANDOM();
		this.reqBuffer = new Player.RequestBuffer();
		JsUtils.propNoWrite(this as Player<S>,
			"familyId", "teamId", "username", "avatar", "reqBuffer",
		);
	}

	public reset(coord: Coord): void {
		super.reset(coord);
		this.status.reset();
		this.reqBuffer.reset();
	}

	/** @virtual Overrides must call super. */
	public _notifyGameNowPlaying(): void { }

	/** @virtual The default implementation does nothing. */
	public _notifyGameNowPaused(): void { }

	/** @virtual The default implementation does nothing. */
	public _notifyGameNowOver(): void { }

	/**
	 * Called automatically by {@link OperatorPlayer#seqBufferAcceptKey}
	 * for {@link OperatorPlayer}s, and by a periodic callback for
	 * {@link ArtificialPlayer}s. Handles behaviour common between all
	 * implementations.
	 *
	 * @final
	 * @throws A previous request is still in flight (unacknowledged).
	 */
	protected makeMovementRequest(dest: Tile, type: Player.MoveType): void {
		if (DEF.DevAssert) {
			if (this.game.status !== Game.Status.PLAYING) {
				throw new Error("This is not a necessary precondition, but we're doing it anyway.");
			}
		}
		if (this.reqBuffer.isFull) return; //⚡

		this.game.processMoveRequest(this.reqBuffer.signRequest({
			initiator: this.playerId,
			lastRejectId: this.reqBuffer.lastRejectId,
			moveDest: dest.coord,
			moveType: type,
		}));
	}

	public get team(): Team<S> {
		return this.game.teams[this.teamId]!;
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
	export type Changes = {
		readonly coord?: Coord,
		readonly health: Player.Health,
	};

	/**
	 * Player Constructor Arguments
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
			.sort((pda, pdb) => teamIdCleaner[pda.teamId]! - teamIdCleaner[pdb.teamId]!)
			.map<CtorArgs>((playerDesc, index) => Object.assign({}, playerDesc, {
				playerId:   index,
				teamId:     teamIdCleaner[playerDesc.teamId],
			}));
		};
	}
	Object.freeze(CtorArgs);


	/**
	 * Used to buffer requests when there is network delay.
	 *
	 * This allows for the client to pipeline a certain number of
	 * requests. If a request is rejected, all following requests are
	 * invalid, and the server can
	 */
	export class RequestBuffer {

		public lastRejectId = 0; // Can just alternate 0 and 1.
		public length = 0;

		public reset(): void {
			this.lastRejectId = 0;
			this.length = 0;
		}

		public get isFull(): boolean {
			return this.length === Game.K.REQUEST_BUFFER_LENGTH;
		}

		/** @requires `!this.isFull` */
		public signRequest(req: StateChange.Req): StateChange.Req {
			if (DEF.DevAssert && this.isFull) {
				throw new Error("never");
			}
			this.length++;
			return req as StateChange.Req;
		}

		public getNextRejectId(): number {
			// return (this.lastRejectId === 0) ? 1 : 0;
			// Above option returns an "elegant" value.
			// Below returns a hard-to-guess value.
			return (this.lastRejectId + Math.floor(99 * Math.random())) % 100;
		}
		/**
		 * Every request signed with the previous rejectId will be
		 * silently dropped by the game manager.
		 */
		public reject(rejectId: number): void {
			this.lastRejectId = rejectId;
			this.length = 0;
		}
		public acceptOldest(): void {
			if (DEF.DevAssert && this.length === 0) {
				throw new Error("never");
			}
			this.length--;
		}
	}
	Object.freeze(RequestBuffer);
	Object.freeze(RequestBuffer.prototype);
}
JsUtils.protoNoEnum(Player,
	"_notifyGameNowPaused", "_notifyGameNowPlaying", "_notifyGameNowOver",
);
Object.freeze(Player);
Object.freeze(Player.prototype);