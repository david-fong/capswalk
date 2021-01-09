import { JsUtils} from "defs/JsUtils";
import { Game } from "../Game";
import { Lang } from "defs/TypeDefs";

import type { Coord, Tile } from "floor/Tile";
import type { StateChange } from "../StateChange";
import type { Grid } from "floor/Grid";
import type { OperatorPlayer } from "../player/OperatorPlayer";

import { Player } from "../player/Player";
import { Team } from "../player/Team";
type Operator<G extends Game.Type> = G extends Game.Type.SERVER ? undefined : OperatorPlayer;

/**
 * Foundational parts of a Game that are not related to event handling.
 */
export abstract class GameMirror<G extends Game.Type, S extends Coord.System = Coord.System> {

	public readonly gameType: G;

	public readonly grid: Grid<S>;

	readonly #onGameBecomeOver: () => void;

	public readonly langFrontend: Lang.FrontendDesc;

	public readonly players: TU.RoArr<Player>;

	public readonly operators: TU.RoArr<OperatorPlayer>;
	#currentOperator: Operator<G>;

	/** Indexable by team ID's. */
	public readonly teams: TU.RoArr<Team>;

	#status: Game.Status;


	/**
	 */
	public constructor(
		gameType: G,
		impl: Game.ImplArgs,
		desc: Game.CtorArgs<G,S>,
	) {
		this.gameType = gameType;

		const gridClass = impl.gridClassLookup(desc.coordSys);
		this.grid = new (gridClass)({
			Grid: gridClass,
			system: desc.coordSys,
			dimensions: desc.gridDimensions,
		}) as GameMirror<G,S>["grid"];

		this.#onGameBecomeOver = impl.onGameBecomeOver;

		this.langFrontend = Lang.GET_FRONTEND_DESC_BY_ID(desc.langId)!;

		// Construct players:
		const players  = this.createPlayers(desc, impl);
		this.players   = players.players;
		this.operators = players.operators;
		Object.freeze(desc);

		{
			const teams: Player[][] = [];
			this.players.forEach((player) => {
				if (!teams[player.teamId]) {
					teams[player.teamId] = [];
				}
				teams[player.teamId]!.push(player);
			});
			this.teams = teams.map((teammateArray, teamId) => {
				return new Team(teamId, teammateArray);
			});
		}
		JsUtils.propNoWrite(this as GameMirror<G,S>,
			"gameType", "grid", "langFrontend",
			"players", "operators", "teams",
		);
		this.players.forEach((player) => player.onTeamsBootstrapped());
		this.setCurrentOperator(0);
	}

	/**
	 * Reset the grid.
	 *
	 * Overrides should not use the return value. They should return
	 * the result of calling `ctorAsync`.
	 */
	public async reset(): Promise<void> {
		this.grid.reset();
		// We must reset status to PAUSED to pass a state-transition
		// assertion when changing status later to PLAYING.
		this.#status = Game.Status.PAUSED;

		// Important: Since there is nothing to do in this game-part's
		// ctorAsync getter, we don't need to use `await`.
	}


	/**
	 * Helper for the constructor.
	 */
	private createPlayers(gameDesc: Game.CtorArgs<G,S>, implArgs: Game.ImplArgs): {
		players: TU.RoArr<Player>,
		operators: TU.RoArr<OperatorPlayer>,
	} {
		const playerDescs
			// @ts-expect-error : RO=
			= gameDesc.playerDescs
			= (this.gameType === Game.Type.ONLINE)
				// The client receives these descriptors already finalized / cleaned by the server.
				? (gameDesc.playerDescs as TU.RoArr<Player.CtorArgs>)
				: Player.CtorArgs.finalize(gameDesc.playerDescs);

		const players = Object.freeze(playerDescs.map((playerDesc) => {
			if (playerDesc.familyId === Player.Family.HUMAN) {
				return (playerDesc.isALocalOperator)
					? new implArgs.OperatorPlayer!(this, playerDesc)
					: new Player(this, playerDesc);
			} else {
				return implArgs.RobotPlayer(
					this as GameMirror<any,any>,
					playerDesc as Player._CtorArgs[Player.RobotFamily],
				);
			}
		}));
		const operators: OperatorPlayer[] = [];
		playerDescs.forEach((desc,i) => {
			if (desc.familyId === Player.Family.HUMAN && desc.isALocalOperator) {
				operators.push(players[i] as OperatorPlayer);
			}
		});
		return Object.freeze({
			players,
			operators,
		});
	}

	/** @final */
	public serializeResetState(): Game.ResetSer {
		const csps: Array<Lang.CharSeqPair> = [];
		const playerCoords = this.players.map((player) => player.coord);
		this.grid.forEach((tile, index) => {
			csps[index] = {
				char: tile.char,
				seq:  tile.seq,
			};
		});
		return JsUtils.deepFreeze({ csps, playerCoords });
	}

	/** @final */
	public deserializeResetState(ser: Game.ResetSer): void {
		JsUtils.deepFreeze(ser);

		this.grid.forEach((tile, index) => {
			this.grid.write(tile.coord, ser.csps[index]!);
		});
		ser.playerCoords.forEach((coord, index) => {
			this.players[index]!.reset(coord);
		});
	}

	public get currentOperator(): G extends Game.Type.SERVER ? undefined : OperatorPlayer {
		return this.#currentOperator;
	}
	public setCurrentOperator(nextOperatorIndex: number): void {
		const nextOperator = this.operators[nextOperatorIndex]!;
		if (!DEF.DevAssert && nextOperator === undefined) throw new Error("never");
		if (this.currentOperator !== nextOperator)
		{
			this.#currentOperator = nextOperator as Operator<G>;
			// IMPORTANT: The order of the above lines matters
			// (hence the method name "notifyWillBecomeCurrent").
		}
	}


	public get status(): Game.Status {
		return this.#status;
	}

	/**
	 * On the client side, this should only be accessed through a
	 * wrapper function that also makes UI-related changes.
	 *
	 * If the game is already playing, this does nothing.
	 */
	public statusBecomePlaying(): void {
		if (this.status === Game.Status.PLAYING) {
			console.info("[statusBecomePlaying]: Game is already playing");
			return;
		}
		if (this.status !== Game.Status.PAUSED) {
			throw new Error("Can only resume a game that is currently paused.");
		}
		this.players.forEach((player) => {
			player.onGamePlaying();
		});
		this.#status = Game.Status.PLAYING;
	}

	/**
	 * On the client side, this should only be accessed through a
	 * wrapper function that also makes UI-related changes.
	 *
	 * If the game is already paused, this does nothing.
	 */
	public statusBecomePaused(): void {
		if (this.status === Game.Status.PAUSED) {
			console.info("[statusBecomePaused]: Game is already paused");
			return;
		}
		if (this.status === Game.Status.OVER) {
			return;
		}
		this.players.forEach((player) => {
			player.onGamePaused();
		});
		this.#status = Game.Status.PAUSED;
	}

	/**
	 * This should be called when all teams have been eliminated.
	 * A team becomes (and subsequently and unconditionally stays)
	 * eliminated when all their members are in a downed state at
	 * the same time.
	 *
	 * This should not be controllable by UI input elements. Instead,
	 * The UI layer can pass a callback to the constructor.
	 */
	public statusBecomeOver(): void {
		if (this.status === Game.Status.OVER) return;
		this.players.forEach((player) => {
			player.onGameOver();
		});
		this.#status = Game.Status.OVER;
		this.#onGameBecomeOver();
		console.info("game is over!");
	}

	public abstract processMoveRequest(desc: StateChange.Req): void;

	/**
	 */
	protected commitTileMods(
		coord: Coord,
		changes: Tile.Changes,
		doCheckOperatorSeqBuffer: boolean = true,
	): void {
		JsUtils.deepFreeze(changes);
		const tile = this.grid.tileAt(coord);

		if (changes.seq !== undefined) {
			// Refresh the operator's `seqBuffer` (maintain invariant) for new CSP:
			if (doCheckOperatorSeqBuffer) {
				// ^Do this when non-operator moves into the the operator's vicinity.
				this.operators.forEach((op) => {
					if (this.grid.tileDestsFrom(op.coord).includes(tile)) {
						op.seqBufferAcceptKey(undefined);
					}
				});
			}
		}
		this.grid.write(coord, changes);
	}

	/**
	 */
	protected commitStateChange(desc: StateChange.Res): void {
		JsUtils.deepFreeze(desc);
		const player = this.players[desc.initiator]!;

		if (desc.rejectId !== undefined) {
			player.reqBuffer.reject(desc.rejectId, player.coord);
			return; //⚡
		}

		Object.entries(desc.tiles).forEach(([coord, changes]) => {
			this.commitTileMods(parseInt(coord), changes);
		});
		Object.entries(desc.players).forEach(([pid, changes]) => {
			const player = this.players[parseInt(pid)]!;
			player.reqBuffer.acceptOldest();
			player.health = changes.health;

			if (changes.coord !== undefined) {
				this.grid.write(player.coord,  {occId: Player.Id.NULL});
				this.grid.write(changes.coord, {occId: player.playerId});
				// === order matters ===
				player.setCoord(changes.coord);
			}
		});
	}
}
Object.freeze(GameMirror);
Object.freeze(GameMirror.prototype);