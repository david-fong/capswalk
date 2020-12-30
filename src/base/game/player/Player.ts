import { JsUtils } from "defs/JsUtils";
import { Game } from "game/Game";

import type { Coord, Tile }      from "floor/Tile";
import type { ArtificialPlayer } from "./ArtificialPlayer";
import type { GameMirror }       from "game/gameparts/GameMirror";
import type { Team }             from "./Team";
import type { StateChange }      from "game/StateChange";

import { Player as _Player } from "defs/TypeDefs";
import { PlayerSkeleton } from "./PlayerSkeleton"; export { PlayerSkeleton };
import { PlayerStatus }   from "./PlayerStatus"; export { PlayerStatus };

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
	public constructor(game: GameMirror<Game.Type,S>, desc: Player.CtorArgs) {
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
		this.reqBuffer.reset(coord);
	}

	/** @virtual Overrides must call super. */
	public onGamePlaying(): void { }

	/** @virtual The default implementation does nothing. */
	public onGamePaused(): void { }

	/** @virtual The default implementation does nothing. */
	public onGameOver(): void { }

	/**
	 * Called automatically by {@link OperatorPlayer#seqBufferAcceptKey}
	 * for {@link OperatorPlayer}s, and by a periodic callback for
	 * {@link ArtificialPlayer}s. Handles behaviour common between all
	 * implementations.
	 *
	 * @final
	 */
	protected makeMovementRequest(dest: Coord, type: Player.MoveType): void {
		if (DEF.DevAssert) {
			if (this.game.status !== Game.Status.PLAYING) {
				// This is not a necessary precondition, but we're doing it anyway.
				throw new Error("never");
			}
		}
		if (this.reqBuffer.isFull) return; //⚡

		this.game.processMoveRequest(this.reqBuffer.signRequest({
			initiator: this.playerId,
			lastRejectId: this.reqBuffer.lastRejectId,
			moveDest: dest,
			moveType: type,
		}));
	}

	public get team(): Team {
		return this.game.teams[this.teamId]!;
	}

	public isTeamedWith(other: Player<S>): boolean {
		return this.team.members.includes(other);
	}
}
export namespace Player {

	export type Family = _Player.Family;
	export type FamilyArtificial = TU.Xcld<Player.Family, "HUMAN">;

	export type Id = _Player.Id;

	/**
	 * Health be picked up from the floor where it is randomly spawned
	 * by the game manager. It can be used to attack enemy players, or
	 * to heal teammates.
	 */
	export type Health   = _Player.Health;
	export type Username = _Player.Username;
	export type Avatar   = _Player.Avatar;
	export type UserInfo = _Player.UserInfo;

	/** @enum */
	export type MoveType = keyof typeof MoveType;
	export const MoveType = Object.freeze(<const>{
		NORMAL: "NORMAL",
		BOOST:  "BOOST",
	});
	MoveType as { [ key in MoveType ]: key };

	export type Changes = {
		readonly coord?: Coord,
		readonly health: Player.Health,
	};

	/**
	 * Player Constructor Arguments
	 */
	export type CtorArgs = _CtorArgs[Player.Family];
	export type _CtorArgs = {
		[F in Player.Family]: _PreIdAssignmentDict[F] & Readonly<{
			playerId: Player.Id;
		}>;
	};;

	interface _PreIdAssignmentDict {
		[Player.Family.HUMAN ]: _PreIdAssignmentConditional<typeof Player.Family.HUMAN> & {
			readonly isALocalOperator: boolean;
			readonly clientId: string | undefined;
		};
		[Player.Family.CHASER]: _PreIdAssignmentConditional<typeof Player.Family.CHASER>;
	}
	type _PreIdAssignmentConditional<F extends Player.Family> = Readonly<{
		familyId: F;
		teamId:   Team.Id;
		username: Username;
		avatar:   Avatar | undefined;
		familyArgs: CtorArgs.FamilySpecificPart[F];
	}>;

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

			return Object.freeze(Object.freeze(playerDescs.slice()
			.sort((pda, pdb) => teamIdCleaner[pda.teamId]! - teamIdCleaner[pdb.teamId]!))
			.map<CtorArgs>((playerDesc, index) => Object.assign({}, playerDesc, {
				playerId: index,
				teamId:   teamIdCleaner[playerDesc.teamId]!,
			})));
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

		#lastRejectId = 0; public get lastRejectId(): number { return this.#lastRejectId; };
		private length = 0;
		public predictedCoord: Coord;

		public reset(coord: Coord): void {
			this.#lastRejectId = 0;
			this.length = 0;
			this.predictedCoord = coord;
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
			this.predictedCoord = req.moveDest;
			return req;
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
		public reject(rejectId: number, realCoord: number): void {
			this.#lastRejectId = rejectId;
			this.length = 0;
			this.predictedCoord = realCoord;
		}
		public acceptOldest(): void {
			// TODO.design this is technically invalid for artificial players
			// on the client side of an online game... Can we move reqBuffer
			// to be just for OperatorPlayers?

			// if (DEF.DevAssert && this.length === 0) {
			// 	throw new Error("never");
			// }
			this.length--;
		}
	}
	Object.freeze(RequestBuffer);
	Object.freeze(RequestBuffer.prototype);
}
Object.assign(Player, _Player);
JsUtils.protoNoEnum(Player,
	"onGamePlaying", "onGamePaused", "onGameOver",
);
Object.freeze(Player);
Object.freeze(Player.prototype);