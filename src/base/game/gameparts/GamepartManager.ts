import { JsUtils } from "defs/JsUtils";
import { Lang } from "lang/Lang";
import { Game } from "../Game";

import type { Coord, Tile } from "floor/Tile";
import { Player } from "../player/Player";
import { ArtificialPlayer } from "../player/ArtificialPlayer";
import { ScoreInfo } from "../ScoreInfo";

import { GamepartEvents } from "./GamepartEvents";

import InitGameManagerCtorMaps from "../ctormaps/CmapManager";
import type { StateChange } from "../StateChange";
InitGameManagerCtorMaps();


/**
 */
export abstract class GamepartManager<G extends Game.Type.Manager, S extends Coord.System> extends GamepartEvents<G,S> {

	public readonly avgHealth: Player.Health;
	public readonly avgHealthPerTile: Player.Health;
	public readonly healthCostOfBoost: Player.Health;
	#currentFreeHealth: Player.Health;
	readonly #healthTiles: Set<Tile>;

	public readonly lang: Lang;
	readonly #langImportPromise: Promise<Lang>;

	private readonly scoreInfo: ScoreInfo;

	/**
	 * Performs the "no invincible player" check (See {@link Player#teamSet}).
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
		this.#healthTiles = new Set();
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
			this.grid.editTile({
				coord: tile.coord,
				...this.dryRunShuffleLangCspAt(tile.coord)
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
				member.reset(spawnPoints[teamIndex]![memberIndex]!);
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
		this.grid.editTile({
			coord, ...Lang.CharSeqPair.NULL
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
	 *
	 * @param sameReqOtherModDescs
	 * A list of other descs including those specifying modifications
	 * to be made in the same `execute???Request` function as the one
	 * for which this is being called. Without this information, we
	 * could mess up `lastKnownUpdateId` counters at those locations.
	 */
	public dryRunSpawnFreeHealth(
		sameReqOtherModDescs: TU.RoArr<Tile.Changes>,
	): TU.RoArr<Tile.Changes> | undefined {
		let healthToSpawn = this.avgHealth - this.currentFreeHealth;
		if (healthToSpawn <= 0) return undefined;
		const retval: Array<Tile.Changes> = [];
		while (healthToSpawn > 0) {
			let tile: Tile;
			do {
				tile = this.grid._getTileAt(this.grid.getRandomCoord());
			} while (
				tile.occId !== undefined
				// The below equality check is necessary to prevent counting bugs.
				|| retval.find((desc) => tile.coord === desc.coord)
				// TODO.impl add other checks to improve distribution and reduce
				// crowding of freeHealth. Make sure it is sensitive to
				// `this.averageFreeHealthPerTile`.
			);
			const tileHealthToAdd = Game.K.AVERAGE_HEALTH_TO_SPAWN_ON_TILE;
			if ((Math.random() < Game.K.HEALTH_UPDATE_CHANCE)) {
				let otherDesc: Tile.Changes | undefined = undefined;
				if (otherDesc = sameReqOtherModDescs.find((desc) => desc.coord === tile.coord)) {
					// @ts-expect-error : RO=
					otherDesc.health
						= (otherDesc.health ?? 0) + tileHealthToAdd;
				} else {
					retval.push({
						now: 1 + tile.now,
						coord: tile.coord,
						// newCharSeqPair: undefined, // "do not change".
						health: tile.health + tileHealthToAdd,
					});
				}
			}
			healthToSpawn -= tileHealthToAdd;
		}
		return retval;
	}


	/** @override */
	protected executeTileModEvent(
		desc: Readonly<Tile>,
		doCheckOperatorSeqBuffer: boolean = true,
	): void {
		JsUtils.deepFreeze(desc);
		const tile = this.grid._getTileAt(desc.coord);
		if (DEF.DevAssert && desc.now !== (1 + tile.now)) {
			// We literally just specified this in processMoveRequest.
			throw new RangeError("never");
		}
		this.#currentFreeHealth += desc.health! - tile.health;
		if (desc.health === 0) {
			this.#healthTiles.delete(tile);
		} else {
			this.#healthTiles.add(tile);
		}
		super.executeTileModEvent(desc, doCheckOperatorSeqBuffer);
	}

	/**
	 * Perform checks on an incoming event request for some action that
	 * a player can perform while the game is playing (ie. not paused
	 * or over).
	 *
	 * @returns
	 * The player specified by the given ID, or undefined if the
	 * game is not playing, in which case the event request should
	 * be rejected.
	 */
	private managerCheckGamePlayingRequest(req: StateChange.Req): Player<S> | undefined {
		if (this.status !== Game.Status.PLAYING) {
			return undefined;
		}
		const player = this.players[req.playerId];
		if (!player) {
			throw new Error("No such player exists.");
		}
		if (req.playerNow !== player.now) {
			throw new RangeError((req.playerNow < player.now)
			? ("Clients should not make requests until they have"
				+ " received my response to their last request.")
			: ("Client seems to have incremented the request ID"
				+ " counter on their own, which is is illegal.")
			);
		}
		return player;
	}


	/**
	 * Reject the request if `dest` is occupied, or if the specified
	 * player does not exist, or the client is missing updates for the
	 * destination they requested to move to, or the player is bubbling.
	 *
	 * @param req
	 * A descriptor of the request describing the requester's views
	 * of critical parts of the game-state from their copy of the game
	 * state at the time of the request. Is modified to describe changes
	 * to be made.
	 */
	public processMoveRequest(req: StateChange.Req): void {
		const player = this.managerCheckGamePlayingRequest(req);
		if (player === undefined) {
			this.executePlayerMoveEvent(req); // Reject the request:
			return; //⚡
		}
		const dest = this.grid._getTileAt(req.dest.coord);
		if (dest.occId !== undefined || dest.now !== req.dest.now) {
			this.executePlayerMoveEvent(req); // Reject the request.
			return; //⚡
		}
		const moveIsBoost = (req.moveType === Player.MoveType.BOOST);
		const newPlayerHealthValue
			= player.status.health
			+ (dest.health * (player.status.isDowned ? Game.K.HEALTH_EFFECT_FOR_DOWNED_PLAYER : 1.0))
			- (moveIsBoost ? this.healthCostOfBoost : 0);
		if (moveIsBoost && newPlayerHealthValue < 0) {
			// Reject a boost-type movement request if it would make
			// the player become downed (or if they are already downed):
			this.executePlayerMoveEvent(req);
			return; //⚡
		}

		// Update stats records:
		const playerScoreInfo = this.scoreInfo.entries[player.playerId]!;
		playerScoreInfo.totalHealthPickedUp += dest.health;
		playerScoreInfo.moveCounts[req.moveType] += 1;

		// Set response fields according to spec in `PlayerMovementEvent`:
		this.executePlayerMoveEvent(<StateChange.Res>{
			eventId: this.nextUnusedEventId,
			playerId: req.playerId,
			moveType: req.moveType,
			playerNow: (1 + player.now),
			playersHealth: {
				[player.playerId]: newPlayerHealthValue,
			},
			dest: {
				coord: dest.coord,
				now: (1 + dest.now),
				health: 0,
				...this.dryRunShuffleLangCspAt(dest.coord),
			},
			tiles: this.dryRunSpawnFreeHealth([req.dest]),
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
	private _processPlayerContact(sourceP: Player<S>): StateChange.Res["playersHealth"] {
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
JsUtils.protoNoEnum(GamepartManager, "managerCheckGamePlayingRequest", "_processPlayerContact");
Object.freeze(GamepartManager);
Object.freeze(GamepartManager.prototype);