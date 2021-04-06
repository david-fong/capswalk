import type * as WebSocket from "ws";
import { JsUtils } from "defs/JsUtils";
import { Game } from "game/Game";

import type { Coord }       from "floor/Tile";
import type { RobotPlayer } from "./RobotPlayer";
import type { GameMirror }  from "game/gameparts/GameMirror";

import { RequestBuffer } from "./RequestBuffer";
import { Player as _Player } from "defs/TypeDefs";
import { Team } from "./Team";

/** */
export class Player extends _Player implements _Player.UserInfo {

	public readonly playerId: Player.Id;
	public readonly familyId: Player.Family;
	public readonly teamId:   Team.Id;
	public readonly username: Player.Username;
	public readonly avatar:   Player.Avatar;

	protected readonly game: GameMirror<any>;
	public readonly reqBuffer: RequestBuffer;
	#coord: Coord;
	#boosts: number = 0.0;

	public prevCoord: Coord = undefined!;

	public get team(): Team        { return this.game.teams[this.teamId]!; }
	public get coord(): Coord      { return this.#coord; }
	public get boosts(): number    { return this.#boosts; }
	public get isDowned(): boolean { return this.boosts < 0.0; } // TODO.design decouple from boost.

	public isTeamedWith(other: Player): boolean {
		return this.team.members.includes(other);
	}

	/** */
	public constructor(game: GameMirror<any>, desc: Player.CtorArgs) {
		super();

		this.playerId = desc.playerId;
		this.familyId = desc.familyId;
		this.teamId   = desc.teamId;
		this.username = desc.username;
		this.avatar   = desc.avatar;

		this.game = game;
		this.reqBuffer = new RequestBuffer();

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

	/** Must be called _after_ the grid has been reset. */
	public reset(coord: Coord): void {
		this.#coord = coord;
		this.prevCoord = coord;
		this.game.grid.moveEntity(this.playerId, coord, coord);
		this.#boosts = 0.0;
		this.reqBuffer.reset(coord);
	}

	/** @virtual The default implementation does nothing. */
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

		this.game.requestStateChange(this.reqBuffer.signRequest({
			initiator: this.playerId,
			lastRejectId: this.reqBuffer.lastRejectId,
			moveType: type,
			moveDest: dest,
		}));
	}

	/**
	 * Notify this Player.
	 *
	 * Causes this Player to update its internal state.
	 * @virtual
	 */
	public _setCoord(dest: Coord): void {
		this.prevCoord = this.coord;
		this.#coord = dest;
	}

	public set boosts(newHealth: number) {
		const oldIsDowned = this.isDowned;
		this.#boosts = newHealth;

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

	/** */
	export type Changes = {
		readonly coord?: Coord,
		readonly boosts: number,
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
		[F in Player.Family]: UserInfo & ({
			readonly familyId: F;
		}) & (
			F extends typeof Player.Family.HUMAN
				? { readonly socket: WebSocket | undefined; }
				: { readonly familyArgs: RobotPlayer.FamilySpecificPart[Exclude<F, "HUMAN">]; }
		);
	};

	export namespace CtorArgs {

		export type UnFin = _PreIdAssignmentDict[Player.Family];

		/**
		 * Mutates the game descriptor to finalize the players field.
		 *
		 * Squashes teamId fields to be suitable for array indices.
		 */
		export function finalize<S extends Coord.System>(
			gameDesc: Game.CtorArgs.UnFin<S>,
		): asserts gameDesc is Game.CtorArgs<S>
		{
			const playerDescs: ReadonlyArray<CtorArgs.UnFin> = gameDesc.players;
			// Map team ID's to consecutive numbers
			// (to play nice with array representations):
			const teamIdCleaner: ReadonlyArray<Team.Id>
				= Array.from(new Set(playerDescs.map((player) => player.teamId)))
				.sort((a, b) => a - b) // This is not a representation requirement.
				.reduce((prev, originalId, squashedId) => {
					prev[originalId] = squashedId;
					return prev;
				}, [] as Array<Team.Id>);

			// @ts-expect-error : RO=
			gameDesc.players
				= playerDescs.slice()
				.sort((pda, pdb) => teamIdCleaner[pda.teamId]! - teamIdCleaner[pdb.teamId]!)
				.freeze()
				.map<CtorArgs>((playerDesc, index) => Object.assign({}, playerDesc, {
					playerId: index,
					teamId:   teamIdCleaner[playerDesc.teamId]!,
					avatar:   playerDesc.avatar ?? Player.Avatar.GET_RANDOM(),
				}))
				.freeze();
		};
	}
	Object.freeze(CtorArgs);
}
JsUtils.protoNoEnum(Player,
	"onGamePlaying", "onGamePaused", "onGameOver",
	"onTeamsBootstrapped",
);
Object.freeze(Player);
Object.freeze(Player.prototype);