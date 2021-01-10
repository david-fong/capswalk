import { JsUtils } from "defs/JsUtils";
import { Game } from "game/Game";

import type { Coord }       from "floor/Tile";
import type { StateChange } from "game/StateChange";
import type { RobotPlayer } from "./RobotPlayer";
import type { GameMirror }  from "game/gameparts/GameMirror";

import { Player as _Player } from "defs/TypeDefs";
import { Team } from "./Team";

/**
 */
export class Player extends _Player implements _Player.UserInfo {

	public readonly playerId: Player.Id;
	public readonly familyId: Player.Family;
	public readonly teamId:   Team.Id;
	public readonly username: Player.Username;
	public readonly avatar:   Player.Avatar;

	protected readonly game: GameMirror<any>;
	public readonly reqBuffer: Player.RequestBuffer;
	#coord: Coord;
	#health: Player.Health = 0.0;

	public prevCoord: Coord;

	public get team()     { return this.game.teams[this.teamId]!; }
	public get coord()    { return this.#coord; }
	public get health()   { return this.#health; }
	public get isDowned() { return this.health < 0.0; }

	public isTeamedWith(other: Player): boolean {
		return this.team.members.includes(other);
	}

	/**
	 */
	public constructor(game: GameMirror<Game.Type,any>, desc: Player.CtorArgs) {
		super();

		this.playerId = desc.playerId;
		this.familyId = desc.familyId;
		this.teamId   = desc.teamId;
		this.username = desc.username;
		this.avatar   = desc.avatar;

		this.game = game;
		this.reqBuffer = new Player.RequestBuffer();

		JsUtils.instNoEnum (this as Player, "game");
		JsUtils.propNoWrite(this as Player, "game",
			"playerId", "familyId", "teamId",
			"username", "avatar", "reqBuffer",
		);
		if (new.target === Player) {
			Object.seal(this); //🧊
		}
	}

	/** @virtual */
	public onTeamsBootstrapped(): void { }

	/**
	 * Must be called _after_ the grid has been reset.
	 */
	public reset(coord: Coord): void {
		this.#coord = coord;
		this.prevCoord = coord;
		this.game.grid.write(coord, {
			occId: this.playerId,
		});
		this.#health = 0.0;
		this.reqBuffer.reset(coord);
	}

	/** @virtual Overrides must call super. */
	public onGamePlaying(): void { }

	/** @virtual The default implementation does nothing. */
	public onGamePaused(): void { }

	/** @virtual The default implementation does nothing. */
	public onGameOver(): void { }

	/** @final */
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

	/**
	 * Notify this Player.
	 *
	 * Causes this Player to update its internal state.
	 */
	public setCoord(dest: Coord): void {
		this.prevCoord = this.coord;
		this.#coord = dest;
	}

	public set health(newHealth: Player.Health) {
		const oldIsDowned = this.isDowned;
		this.#health = newHealth;

		if (oldIsDowned || !this.isDowned) return;
		const team  = this.team;
		const teams = this.game.teams;
		if (team.elimOrder !== Team.ElimOrder.STANDING) {
			return;
		}
		// Right before this downing event, the team has not been
		// soft-eliminated yet, but it might be now. Check it:
		if (team.members.every((player) => player.isDowned)) {
			// All players are downed! The team is now eliminated:
			const numNonStandingTeams
				= 1 + teams.filter((team) => {
				return team.elimOrder !== Team.ElimOrder.STANDING;
			}).length;

			team.elimOrder = 1 + teams.filter((team) => {
				return team.elimOrder !== Team.ElimOrder.STANDING;
			}).length;
			// Now that a team is newly-eliminated, check if the
			// game should end:
			if (numNonStandingTeams === teams.length) {
				this.game.statusBecomeOver();
			}
		}
	}
}
export namespace Player {

	export type Family = _Player.Family;
	export type RobotFamily = TU.Xcld<Player.Family, "HUMAN">;

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
			avatar: Avatar;
		}>;
	};

	type _PreIdAssignmentDict = {
		[F in Player.Family]: F extends typeof Player.Family.HUMAN
		? _PreIdAssignmentConditional<F> & {
			readonly clientId: string | undefined;
		}
		: _PreIdAssignmentConditional<F>;
	};
	type _PreIdAssignmentConditional<F extends Player.Family> = Readonly<{
		familyId: F;
		teamId:   Team.Id;
		username: Username;
		avatar?:  Avatar;
		familyArgs: CtorArgs.FamilySpecificPart[F];
	}>;

	export namespace CtorArgs {

		export type UnFin = _PreIdAssignmentDict[Player.Family];

		export interface FamilySpecificPart extends RobotPlayer.FamilySpecificPart {
			[Player.Family.HUMAN]: {};
		}

		/**
		 * @returns
		 * Squashes teamId fields to be suitable for array indices.
		 */
		export function finalize<S extends Coord.System>(
			gameDesc: Game.CtorArgs.UnFin<S>,
		): asserts gameDesc is Game.CtorArgs<S>
		{
			const playerDescs: TU.RoArr<CtorArgs.UnFin> = gameDesc.players;
			// Map team ID's to consecutive numbers
			// (to play nice with array representations):
			const teamIdCleaner: TU.RoArr<Team.Id>
				= Array.from(new Set(playerDescs.map((player) => player.teamId)))
				.sort((a, b) => a - b) // This is not a representation requirement.
				.reduce((prev, originalId, squashedId) => {
					prev[originalId] = squashedId;
					return prev;
				}, [] as Array<Team.Id>);

			// @ts-expect-error : RO=
			gameDesc.players
				= Object.freeze(Object.freeze(playerDescs.slice()
				.sort((pda, pdb) => teamIdCleaner[pda.teamId]! - teamIdCleaner[pdb.teamId]!))
				.map<CtorArgs>((playerDesc, index) => Object.assign({}, playerDesc, {
					playerId: index,
					teamId:   teamIdCleaner[playerDesc.teamId]!,
					avatar:   playerDesc.avatar ?? Player.Avatar.GET_RANDOM(),
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
JsUtils.protoNoEnum(Player,
	"onGamePlaying", "onGamePaused", "onGameOver",
	"onTeamsBootstrapped",
);
Object.freeze(Player);
Object.freeze(Player.prototype);