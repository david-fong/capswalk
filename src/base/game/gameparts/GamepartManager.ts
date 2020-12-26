import { JsUtils } from "defs/JsUtils";
import { Lang } from "lang/Lang";
import { Game } from "../Game";

import type { Coord, Tile } from "floor/Tile";
import { Player } from "../player/Player";
import { ArtificialPlayer } from "../player/ArtificialPlayer";
import { ScoreInfo } from "../ScoreInfo";

import { GamepartBase } from "./GamepartBase";

import InitGameManagerCtorMaps from "../ctormaps/CmapManager";
import type { StateChange } from "../StateChange";
InitGameManagerCtorMaps();


/**
 */
export abstract class GamepartManager<G extends Game.Type.Manager, S extends Coord.System> extends GamepartBase<G,S> {

	public readonly avgHealth: Player.Health = 0.0;
	public readonly avgHealthPerTile: Player.Health = 0.0;
	public readonly healthCostOfBoost: Player.Health = 0.0;
	#currentFreeHealth: Player.Health = 0.0;
	readonly #healthTiles = new Set<Tile>();

	public readonly lang: Lang;
	readonly #langImportPromise: Promise<Lang>;

	private readonly scoreInfo: ScoreInfo;

	/**
	 */
	public constructor(
		gameType: G,
		impl: Game.ImplArgs,
		desc: Game.CtorArgs<G,S>,
	) {
		super(gameType, impl, desc);
		this.avgHealth = desc.averageFreeHealthPerTile * this.grid.area;
		this.avgHealthPerTile = desc.averageFreeHealthPerTile;
		this.healthCostOfBoost = Game.K.HEALTH_COST_OF_BOOST(
			this.avgHealthPerTile,
			this.grid.static.getDiameterOfLatticePatchHavingArea,
		);
		this.scoreInfo = new ScoreInfo(this.players.map((player) => player.playerId));
		JsUtils.propNoWrite(this as GamepartManager<G,S>,
			"avgHealth", "avgHealthPerTile", "healthCostOfBoost", "scoreInfo",
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
			this.lang = new LangConstructor(desc.langWeightExaggeration);
			JsUtils.propNoWrite(this as GamepartManager<G,S>, "lang");

			const minLangLeaves = this.grid.static.getAmbiguityThreshold();
			if (DEF.DevAssert && this.lang.numLeaves < minLangLeaves) {
				// Enforced By: UI code, and `GamepartManager.CHECK_VALID_CTOR_ARGS`.
				throw new Error("never");
				/* The provided mappings composing the current Lang-under-construction
				are not sufficient to ensure that a shuffling operation will always
				be able to find a safe candidate to use as a replacement. Please see
				the spec for Lang.getNonConflictingChar. */
			}
			return this.lang;
		});
	}

	/**
	 */
	public async reset(): Promise<void> {
		// Reset the grid and event record:
		await super.reset();

		this.#currentFreeHealth = 0.0;
		this.#healthTiles.clear();

		// Reset hit-counters in the current language:
		// This must be done before shuffling so that the previous
		// history of shuffle-ins has no effects on the new pairs.
		await this.#langImportPromise;
		this.lang.reset();
		// Shuffle everything:
		this.grid.shuffledForEachTile((tile) => {
			this.grid.editTile(tile.coord, {
				...this.dryRunShuffleLangCspAt(tile.coord, true)
			});
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
				this.grid.editTile(coord, {
					occId: member.playerId,
				});
			});
		});
		this.scoreInfo.reset();

		return Promise.resolve();
	}

	/** @override */
	protected _createArtifPlayer(desc: Player._CtorArgs<Player.FamilyArtificial>): ArtificialPlayer<S> {
		return ArtificialPlayer.of(this, desc);
	}


	/**
	 * **Important:** Nullifies the existing values at `tile` and does
	 * not consume the returned values, which must be done externally.
	 *
	 * @param targetTile
	 * The Tile to shuffle their {@link Lang.CharSeqPair}
	 * pair for.
	 *
	 * @param doCheckEmptyTiles
	 * Pass `true` when populating a grid which has been reset.
	 *
	 * @returns
	 * A {@link Lang.CharSeqPair} that can be used as a replacement
	 * for that currently being used by `tile`.
	 */
	public dryRunShuffleLangCspAt(coord: Coord, doCheckEmptyTiles: boolean = false): Lang.CharSeqPair {
		// First, clear values for the target tile so its current
		// (to-be-previous) values don't get unnecessarily avoided.
		this.grid.editTile(coord, {
			...Lang.CharSeqPair.NULL
		});

		let avoid: TU.RoArr<Lang.Seq> = this.grid
			.getDestsFromSourcesTo(coord)
			.map((tile) => tile.seq);
		// ^ Note: An array of CharSeq from unique Tiles. It is okay
		// for those tiles to include `coord`, and it is okay for
		// those
		if (doCheckEmptyTiles) {
			const nullSeq = Lang.CharSeqPair.NULL.seq;
			avoid = avoid.filter((seq) => seq !== nullSeq);
		}
		Object.freeze(avoid);
		return this.lang.getNonConflictingChar(avoid);
	}

	public get currentFreeHealth(): Player.Health {
		return this.#currentFreeHealth;
	}

	public get freeHealthTiles(): ReadonlySet<Tile> {
		return this.#healthTiles;
	}

	/**
	 * @returns
	 * A descriptor of changes to make to tiles regarding health spawning.
	 *
	 * **`IMPORTANT`**: This method does not have any override structure
	 * where the Server additionally notifies clients of the changes. It
	 * is intended to be wrapped inside other events with such behaviour.
	 *
	 * Note that this will seem to have a one-movement-event delay in
	 * specifying changes to be made because `this.currentFreeHealth`
	 * does not update until after the movement request has been
	 * executed.
	 */
	public dryRunSpawnFreeHealth(changes: Record<Coord, Tile.Changes>): Record<Coord, Tile.Changes> {
		let healthToSpawn = this.avgHealth - this.currentFreeHealth;
		if (healthToSpawn <= 0) {
			return changes;
		}
		while (healthToSpawn > 0) {
			let tile: Tile;
			do {
				tile = this.grid._getTileAt(this.grid.getRandomCoord());
			} while (
				tile.occId !== Player.Id.NULL || changes[tile.coord] !== undefined
				// TODO.design add other checks to improve distribution and reduce
				// crowding of freeHealth. Make sure it is sensitive to
				// `this.averageFreeHealthPerTile`.
			);
			const tileHealthToAdd = Game.K.AVERAGE_HEALTH_TO_SPAWN_ON_TILE;
			if ((Math.random() < Game.K.HEALTH_UPDATE_CHANCE)) {
				let otherDesc = changes[tile.coord];
				if (otherDesc !== undefined) {
					// @ts-expect-error : RO=
					otherDesc.health = (otherDesc.health ?? 0) + tileHealthToAdd;
				} else {
					changes[tile.coord] = {
						// newCharSeqPair: undefined, // "do not change".
						health: tile.health + tileHealthToAdd,
					};
				}
			}
			healthToSpawn -= tileHealthToAdd;
		}
		return changes;
	}


	/** @override */
	protected commitTileMods(
		coord: Coord, desc: Tile.Changes,
		doCheckOperatorSeqBuffer: boolean = true,
	): void {
		JsUtils.deepFreeze(desc);
		const tile = this.grid._getTileAt(coord);
		this.#currentFreeHealth += desc.health! - tile.health;
		if (desc.health === 0) {
			this.#healthTiles.delete(tile);
		} else {
			this.#healthTiles.add(tile);
		}
		super.commitTileMods(coord, desc, doCheckOperatorSeqBuffer);
	}


	/**
	 * Reject the request if `dest` is occupied, or if the specified
	 * player does not exist, or the client is missing updates for the
	 * destination they requested to move to, or the player is bubbling.
	 */
	public processMoveRequest(req: StateChange.Req): void {
		const initiator = this.players[req.initiator]!;
		const reqDest = this.grid._getTileAt(req.moveDest);
		if (  this.status !== Game.Status.PLAYING
		 || reqDest.occId !== Player.Id.NULL
		) {
			this.commitStateChange({ rejected: true, initiator: req.initiator });
			return; //⚡
		}
		const moveIsBoost = (req.moveType === Player.MoveType.BOOST);
		const newPlayerHealthValue
			= initiator.status.health
			+ (reqDest.health * (initiator.status.isDowned ? Game.K.HEALTH_EFFECT_FOR_DOWNED_PLAYER : 1.0))
			- (moveIsBoost ? this.healthCostOfBoost : 0);
		if (moveIsBoost && newPlayerHealthValue < 0) {
			// Reject a boost-type movement request if it would make
			// the player become downed (or if they are already downed):
			this.commitStateChange({ rejected: true, initiator: req.initiator });
			return; //⚡
		}

		// Update stats records:
		const playerScoreInfo = this.scoreInfo.entries[initiator.playerId]!;
		playerScoreInfo.totalHealthPickedUp += reqDest.health;
		playerScoreInfo.moveCounts[req.moveType] += 1;

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
			tiles: this.dryRunSpawnFreeHealth({
				[req.moveDest]: {
					health: 0,
					...this.dryRunShuffleLangCspAt(reqDest.coord),
				},
			}),
		});
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
	private _processPlayerContact(sourceP: Player<S>): StateChange.Res["initiator"] {
		return undefined!;
	}


	public abstract setTimeout(callback: Function, millis: number, ...args: any[])
	: number | NodeJS.Timeout;

	public abstract cancelTimeout(handle: number | NodeJS.Timeout): void;
}
export namespace GamepartManager {
	/**
	 * If cleaning can be appropriately performed, this function will
	 * do so. If not, it will indicate invalidities in its return value.
	 */
	// TODO.impl check lang and coord-sys compatibility.
	export function CHECK_VALID_CTOR_ARGS(
		args: TU.NoRo<Game.CtorArgs<Game.Type.SERVER,Coord.System>>,
	): string[] {
		const fr: string[] = [];
		type Keys = keyof Game.CtorArgs<Game.Type,Coord.System>;
		const requiredFields: {[K in Keys]: any} = Object.freeze({
			coordSys: 0, gridDimensions: 0, averageFreeHealthPerTile: 0,
			langId: 0, langWeightExaggeration: 0, playerDescs: 0,
		});
		const missingFields: string[] = [];
		for (const fieldName in requiredFields) {
			const field = args[fieldName as Keys];
			if (field === undefined || field === null) {
				missingFields.push(fieldName as Keys);
			}
		}
		if (missingFields.length) {
			fr.push("Missing the following arguments: " + missingFields);
		}
		if (Lang.GET_FRONTEND_DESC_BY_ID(args.langId) === undefined) {
			fr.push(`No language with the ID \`${args.langId}\` exists.`);
		}

		if (parseInt(args.langWeightExaggeration as any) === NaN) {
			fr.push(`Language Weight Exaggeration expected a number, but`
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
		return fr;
	}
}
JsUtils.protoNoEnum(GamepartManager, "_processPlayerContact");
Object.freeze(GamepartManager);
Object.freeze(GamepartManager.prototype);