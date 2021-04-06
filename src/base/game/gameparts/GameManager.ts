import { JsUtils } from "defs/JsUtils";
import { Lang, LangDescs } from "lang/Lang";
import { Game } from "../Game";

import type { Coord, Tile } from "floor/Tile";
import type { StateChange } from "../StateChange";
import { Player } from "../player/Player";
import { ScoreInfo } from "./ScoreInfo";
import { Grid } from "floor/Grid";

import { GameMirror } from "./GameMirror";

import InitGameManagerCtorMaps from "../ctormaps/CmapManager";
InitGameManagerCtorMaps();

/** */
export abstract class GameManager<
	S extends Coord.System = Coord.System,
> extends GameMirror<S> {

	public readonly lang: Lang = undefined!;
	readonly #langImportPromise: Promise<Lang>;

	private readonly scoreInfo: ScoreInfo;

	/** */
	public constructor(args: {
		readonly impl: Game.ImplArgs,
		readonly desc: Game.CtorArgs<S>,
		readonly operatorIds: ReadonlyArray<Player.Id>,
	}) {
		super(args);

		this.scoreInfo = new ScoreInfo(this.players.map((player) => player.playerId));
		JsUtils.propNoWrite(this as GameManager<S>, "scoreInfo");

		// https://webpack.js.org/api/module-methods/#dynamic-expressions-in-import
		this.#langImportPromise = Lang.Import(args.desc.langId).then((LangConstructor) => {
			// @ts-expect-error : RO=
			this.lang = new LangConstructor(args.desc.langWeightExaggeration);
			JsUtils.propNoWrite(this as GameManager<S>, "lang");

			if (DEF.DevAssert && (LangDescs[args.desc.langId]!.isolatedMinOpts < this.grid.static.ambiguityThreshold)) {
				// Enforced By: clientside UI and `CHECK_VALID_CTOR_ARGS`.
				throw new Error("never");
			}
			return this.lang;
		});
	}

	/** */
	public async reset(): Promise<Game.ResetSer> {
		// Reset the grid and event record:
		super.reset();
		const resetSer = Object.freeze({
			playerCoords: [] as Coord[],
			csps: [] as Lang.Csp[],
		});

		// Reset hit-counters in the current language:
		// This must be done before shuffling so that the previous
		// history of shuffle-ins has no effects on the new pairs.
		await this.#langImportPromise;
		this.lang.reset();
		this.grid.forEachShuffled((tile, index) => {
			const csp = this.dryRunShuffleLangCspAt(tile.coord);
			this.grid.write(tile.coord, csp);
			resetSer.csps[index] = csp;
		});

		// Reset and spawn players:
		this.teams.forEach((team) => team.reset());
		const spawnPoints = this.grid.static.getSpawnCoords(
			this.teams.map((team) => team.members.length),
			this.grid.dimensions,
		);
		this.teams.forEach((team, teamIndex) => {
			team.members.forEach((member, memberIndex) => {
				const coord = spawnPoints[teamIndex]![memberIndex]!;
				member.reset(coord);
				resetSer.playerCoords[member.playerId] = coord;
			});
		});
		this.scoreInfo.reset();

		return resetSer;
	}


	/**
	 * **Important:** Nullifies the existing values at `tile` and does
	 * not consume the returned values, which must be done externally.
	 *
	 * @param coord
	 *
	 * @returns
	 * A {@link Lang.Csp} that can be used as a replacement for that
	 * currently in `tile`.
	 */
	private dryRunShuffleLangCspAt(coord: Coord): Lang.Csp {
		// First, clear values for the target tile so its current
		// (to-be-previous) values don't get unnecessarily avoided.
		this.grid.write(coord, { seq: "" });

		let avoid = this.grid
			.getAllAltDestsThan(coord)
			.map((tile) => tile.seq)
			.freeze();
		return this.lang.getNonConflictingChar(avoid);
	}

	/** @override */
	public requestStateChange(req: StateChange.Req, socket?: any): void {
		const causer = this.players[req.initiator]!;
		if (req.lastRejectId !== causer.reqBuffer.lastRejectId) {
			// client hasn't received previously sent reject ID yet.
			return; //⚡
		}
		const reqDest = this.grid.tileAt(req.moveDest);
		if (this.status !== Game.Status.PLAYING || this.grid.isOccupied(reqDest.coord)) {
			this.commitStateChange({
				rejectId: causer.reqBuffer.getNextRejectId(),
				initiator: req.initiator,
			}, socket);
			return; //⚡
		}
		const moveIsBoost = (req.moveType === Player.MoveType.BOOST);
		const causerNewBoosts = causer.boosts + (moveIsBoost ? -1 : Game.K.PORTION_OF_MOVES_THAT_ARE_BOOST);
		if (moveIsBoost && causerNewBoosts < 0) {
			this.commitStateChange({
				rejectId: causer.reqBuffer.getNextRejectId(),
				initiator: req.initiator,
			}, socket);
			return; //⚡
		}

		// Update stats records:
		const scoreInfo = this.scoreInfo.entries[causer.playerId]!;
		scoreInfo.moveCounts[req.moveType] += 1;

		// Set response fields according to spec in `PlayerMovementEvent`:
		this.commitStateChange(<StateChange.Res.Accepted>{
			initiator: req.initiator,
			moveType: req.moveType,
			players: {
				[causer.playerId]: {
					boosts: causerNewBoosts,
					coord: reqDest.coord,
				},
			},
			tiles: [],
		}, socket);
	}

	public abstract setTimeout(callback: Function, millis: number, ...args: any[]): number;
	public abstract cancelTimeout(handle: number): void;
}
export namespace GameManager {
	/**
	 * If cleaning can be appropriately performed, this function will
	 * do so. If not, it will indicate invalidities in its return value.
	 */
	export function CHECK_VALID_CTOR_ARGS(
		args: TU.NoRo<Game.CtorArgs.UnFin>,
	): string[] {
		//#region
		const bad: string[] = [];
		type Keys = keyof Game.CtorArgs.UnFin;
		const requiredFields: {[K in Keys]: any} = Object.freeze({
			coordSys: 0, gridDimensions: 0, averageHealthPerTile: 0,
			langId: 0, langWeightExaggeration: 0, players: 0,
		});
		const missingFields: Keys[] = [];
		for (const fieldName in requiredFields) {
			const field = args[fieldName as Keys];
			if (field === undefined || field === null) {
				missingFields.push(fieldName as Keys);
			}
		}
		if (missingFields.length) {
			bad.push("Missing the following arguments: " + missingFields);
		}

		const langDesc = Lang.GetDesc(args.langId);
		const gridClass = Grid._Constructors[args.coordSys];
		if (langDesc === undefined) {
			bad.push(`No language with the ID \`${args.langId}\` exists.`);
		} else if (gridClass === undefined) {
			bad.push(`No grid with the system ID \`${args.coordSys}\` exists.`);
		} else {
			if (langDesc.isolatedMinOpts < gridClass.ambiguityThreshold) {
				bad.push("The provided language does not have enough sequences"
				+"\nto ensure that a shuffling operation will always succeed when"
				+"\npaired with the provided grid system.");
			}
		}

		if (parseInt(args.langWeightExaggeration as any) === NaN) {
			bad.push(`Language Weight Exaggeration expected a number, but`
			+ `\`${args.langWeightExaggeration}\` is not a number.`);
		} else {
			args.langWeightExaggeration = Math.max(0, parseFloat(
				args.langWeightExaggeration as any
			));
		}
		// TODO.impl check all the rest of the things.
		// if (!(Player.Username.REGEXP.test(desc.username))) {
		//     throw new RangeError(`Username \"${desc.username}\"`
		//     + ` does not match the required regular expression,`
		//     + ` \"${Player.Username.REGEXP.source}\".`
		//     );
		// }
		return bad;
		//#endregion
	}
}
Object.freeze(GameManager);
Object.freeze(GameManager.prototype);