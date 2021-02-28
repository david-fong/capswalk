import { JsUtils } from "defs/JsUtils";
import { Lang } from "lang/Lang";
import { Game } from "../Game";

import type { Coord, Tile } from "floor/Tile";
import type { StateChange } from "../StateChange";
import { Player } from "../player/Player";
import { HealthInfo } from "./HealthInfo";
import { ScoreInfo } from "./ScoreInfo";
import { Grid } from "floor/Grid";

import { GameMirror } from "./GameMirror";

import InitGameManagerCtorMaps from "../ctormaps/CmapManager";
InitGameManagerCtorMaps();

/** */
export abstract class GameManager<
	S extends Coord.System = Coord.System,
> extends GameMirror<S> {

	public readonly health: HealthInfo;

	public readonly lang: Lang = undefined!;
	readonly #langImportPromise: Promise<Lang>;

	private readonly scoreInfo: ScoreInfo;

	/** */
	public constructor(args: {
		readonly impl: Game.ImplArgs,
		readonly desc: Game.CtorArgs<S>,
		readonly operatorIds: TU.RoArr<Player.Id>,
	}) {
		super(args);

		this.health = new HealthInfo(args.desc, this.grid.static as Grid.ClassIf<any>);
		this.scoreInfo = new ScoreInfo(this.players.map((player) => player.playerId));
		JsUtils.propNoWrite(this as GameManager<S>,
			"health", "scoreInfo",
		);

		// https://webpack.js.org/api/module-methods/#dynamic-expressions-in-import
		this.#langImportPromise = (import(
			/* webpackChunkName: "lang/[request]" */
			`lang/impl/${this.langFrontend.module}.ts`
		)).then((langModule) => {
			const LangConstructor = this.langFrontend.export.split(".").reduce<any>(
				(nsps, propName) => nsps[propName],
				langModule[this.langFrontend.module],
			) as Lang.ClassIf;
			// @ts-expect-error : RO=
			this.lang = new LangConstructor(args.desc.langWeightExaggeration);
			JsUtils.propNoWrite(this as GameManager<S>, "lang");

			if (DEF.DevAssert && (this.lang.numLeaves < this.grid.static.ambiguityThreshold)) {
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
			csps: [] as Lang.CharSeqPair[],
		});

		this.health.reset();

		// Reset hit-counters in the current language:
		// This must be done before shuffling so that the previous
		// history of shuffle-ins has no effects on the new pairs.
		await this.#langImportPromise;
		this.lang.reset();
		this.grid.forEachShuffled((tile, index) => {
			const csp = this.dryRunShuffleLangCspAt(tile.coord, true);
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
	 * @param doCheckEmptyTiles
	 * Pass `true` when populating a grid which has been reset. This
	 * is for performance optimization purposes. It can be safely
	 * ignored.
	 *
	 * @returns
	 * A {@link Lang.CharSeqPair} that can be used as a replacement
	 * for that currently being used by `tile`.
	 */
	private dryRunShuffleLangCspAt(coord: Coord, doCheckEmptyTiles: boolean = false): Lang.CharSeqPair {
		// First, clear values for the target tile so its current
		// (to-be-previous) values don't get unnecessarily avoided.
		this.grid.write(coord, Lang.CharSeqPair.NULL);

		let avoid = this.grid
			.getAllAltDestsThan(coord)
			.map((tile) => tile.seq)
			.freeze();
		// ^ Note: An array of CharSeq from unique Tiles. It is okay
		// for those tiles to include `coord`
		if (doCheckEmptyTiles) {
			const nullSeq = Lang.CharSeqPair.NULL.seq;
			avoid = avoid.filter((seq) => seq !== nullSeq).freeze();
		}
		return this.lang.getNonConflictingChar(avoid);
	}

	/**
	 * @returns
	 * A descriptor of changes to make to tiles regarding health spawning.
	 *
	 * Note that this will seem to have a one-movement-event delay in
	 * specifying changes to be made because `this.currentFreeHealth`
	 * does not update until after the movement request has been
	 * executed.
	 */
	private dryRunSpawnHealth(changes: Record<Coord, Tile.Changes>): Record<Coord, Tile.Changes> {
		let healthToSpawn = this.health.K.avg - this.health.currentAmount;
		if (healthToSpawn <= 0) {
			return changes;
		}
		while (healthToSpawn > 0) {
			let tile: Tile;
			do {
				tile = this.grid.tileAt(this.grid.getRandomCoord());
			} while (
				tile.occId !== Player.Id.NULL
				// TODO.design add other checks to improve distribution and reduce
				// crowding of freeHealth. Make sure it is sensitive to
				// `this.averageFreeHealthPerTile`.
			);
			const healthToAdd = Game.K.AVERAGE_HEALTH_TO_SPAWN_ON_TILE;
			if ((Math.random() < Game.K._HEALTH_UPDATE_CHANCE)) {
				let otherDesc = changes[tile.coord];
				if (otherDesc !== undefined) {
					// @ts-expect-error : RO=
					otherDesc.health = (otherDesc.health ?? 0) + healthToAdd;
				} else {
					changes[tile.coord] = {
						health: tile.health + healthToAdd,
					};
				}
			}
			healthToSpawn -= healthToAdd;
		}
		return changes;
	}


	/** @override */
	public processMoveRequest(req: StateChange.Req, socket?: any): void {
		const initiator = this.players[req.initiator]!;
		if (req.lastRejectId !== initiator.reqBuffer.lastRejectId) {
			return; //⚡
		}
		const reqDest = this.grid.tileAt(req.moveDest);
		if (  this.status !== Game.Status.PLAYING
		 || reqDest.occId !== Player.Id.NULL
		) {
			this.commitStateChange({
				rejectId: initiator.reqBuffer.getNextRejectId(),
				initiator: req.initiator,
			}, socket);
			return; //⚡
		}
		const moveIsBoost = (req.moveType === Player.MoveType.BOOST);
		const newPlayerHealthValue
			= initiator.health
			+ (reqDest.health * (initiator.isDowned ? Game.K.HEALTH_EFFECT_FOR_DOWNED_PLAYER : 1.0))
			- (moveIsBoost ? this.health.K.costOfBoost(reqDest) : 0);
		if (moveIsBoost && newPlayerHealthValue < 0) {
			// Reject a boost-type movement request if it would make
			// the player become downed (or if they are already downed):
			this.commitStateChange({
				rejectId: initiator.reqBuffer.getNextRejectId(),
				initiator: req.initiator,
			}, socket);
			return; //⚡
		}

		// Update stats records:
		const scoreInfo = this.scoreInfo.entries[initiator.playerId]!;
		scoreInfo.totalHealthPickedUp += reqDest.health;
		scoreInfo.moveCounts[req.moveType] += 1;

		// Set response fields according to spec in `PlayerMovementEvent`:
		this.commitStateChange(<StateChange.Res.Accepted>{
			initiator: req.initiator,
			moveType: req.moveType,
			players: {
				[initiator.playerId]: {
					health: newPlayerHealthValue,
					coord: reqDest.coord,
				},
			},
			tiles: this.dryRunSpawnHealth({
				[req.moveDest]: {
					health: 0,
					...this.dryRunShuffleLangCspAt(reqDest.coord),
				},
			}),
		}, socket);
	}

	/**
	 *
	 * 1. Design decision: Change bubble mechanism:
	 * - Activates automatically and immediately upon players entering each others' (mutual) attack range, or by pressing space in the (mutual) attack range of other players.
	 * - When done automatically, health will be levelled-down enough to cause as many changes in downed-ness as possible by changing other opponents' health to -1 and teammates' health to 0.
	 * - If done by pressing space, health will be levelled further until the space-presser's health is at zero.
	 * - The player with the highest health upon contact, or the player who pressed space is considered the attacker.
	 *   - If the attacker is downed (ie. everyone in the interaction is downed), no changes should be made.
	 *     Just short circuit.
	 *   - First, for each un-downed enemy (non-teammate) in range (sorted to evenly distribute downed-ness),
	 *     the attacker will subtract that enemy's health+1 from its own, causing that enemy to become downed
	 *     (health === -1 \< 0) until all enemies are downed, or any further whole-health-subtractions would
	 *     cause it to become downed.
	 *   - If it still has more health, it does something similar for its teammates.
	 *
	 * @param sourceP
	 */
	private _processPlayerContact(sourceP: Player): StateChange.Res["initiator"] {
		return undefined!;
	}

	/** @override */
	protected commitTileMods(
		coord: Coord, changes: Tile.Changes,
		doCheckOperatorSeqBuffer: boolean = true,
	): void {
		// JsUtils.deepFreeze(changes); // <- already done by caller.
		const tile = this.grid.tileAt(coord);
		if (changes.health !== undefined) {
			this.health.add(changes.health - tile.health);
			if (changes.health <= 0) {
				this.health.tiles.delete(coord);
			} else {
				this.health.tiles.set(coord, tile);
			}
		}
		super.commitTileMods(coord, changes, doCheckOperatorSeqBuffer);
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

		const langDesc = Lang.GET_FRONTEND_DESC_BY_ID(args.langId);
		const gridClass = Grid._Constructors[args.coordSys];
		if (langDesc === undefined) {
			bad.push(`No language with the ID \`${args.langId}\` exists.`);
		} else if (gridClass === undefined) {
			bad.push(`No grid with the system ID \`${args.coordSys}\` exists.`);
		} else {
			if (langDesc.numLeaves < gridClass.ambiguityThreshold) {
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
JsUtils.protoNoEnum(GameManager, "_processPlayerContact");
Object.freeze(GameManager);
Object.freeze(GameManager.prototype);