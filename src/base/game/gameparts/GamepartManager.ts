import { JsUtils } from "defs/JsUtils";
import { Lang } from "lang/Lang";
import { Game } from "game/Game";

import { Coord } from "floor/Coord";
import type { Tile } from "floor/Tile";
import { Player } from "../player/Player";
import { ArtificialPlayer } from "../player/ArtificialPlayer";
import { ScoreInfo } from "../ScoreInfo";

import type { PlayerGeneratedRequest } from "../events/EventRecordEntry";
import {
	PlayerActionEvent, TileModEvent,
	GamepartEvents,
} from "./GamepartEvents";

import InitGameManagerCtorMaps from "game/ctormaps/CmapManager";
InitGameManagerCtorMaps();


/**
 *
 */
export abstract class GamepartManager<G extends Game.Type.Manager, S extends Coord.System> extends GamepartEvents<G,S> {

	public readonly averageFreeHealth: Player.Health;
	public readonly averageFreeHealthPerTile: Player.Health;
	public readonly healthCostOfBoost: Player.Health;
	#currentFreeHealth: Player.Health;
	readonly #freeHealthTiles: Set<Tile<S>>;

	public readonly lang: Lang;
	readonly #langImportPromise: Promise<Lang>;

	private readonly scoreInfo: ScoreInfo;

	/**
	 * Performs the "no invincible player" check (See {@link Player#teamSet}).
	 *
	 * @param gameType -
	 * @param impl -
	 * @param desc -
	 */
	public constructor(
		gameType: G,
		impl: Game.ImplArgs<G,S>,
		desc: Game.CtorArgs<G,S>,
	) {
		super(gameType, impl, desc);
		this.averageFreeHealth = desc.averageFreeHealthPerTile * this.grid.area;
		this.averageFreeHealthPerTile = desc.averageFreeHealthPerTile;
		this.healthCostOfBoost = Game.K.HEALTH_COST_OF_BOOST(
			this.averageFreeHealthPerTile,
			this.grid.static.getDiameterOfLatticePatchHavingArea,
		);
		this.#freeHealthTiles = new Set();
		this.scoreInfo = new ScoreInfo(this.players.map((player) => player.playerId));
		JsUtils.propNoWrite(this as GamepartManager<G,S>, [
			"averageFreeHealth", "averageFreeHealthPerTile", "healthCostOfBoost", "scoreInfo",
		]);

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
			JsUtils.propNoWrite(this as GamepartManager<G,S>, ["lang"]);

			const minLangLeaves = this.grid.static.getAmbiguityThreshold();
			if (DEF.DevAssert && this.lang.numLeaves < minLangLeaves) {
				// Enforced By: UI code, and `GamepartManager.CHECK_VALID_CTOR_ARGS`.
				throw new Error(`Found ${this.lang.numLeaves} leaves, but at`
				+ ` least ${minLangLeaves} were required. The provided mappings`
				+ ` composing the current Lang-under-construction are not`
				+ ` sufficient to ensure that a shuffling operation will always`
				+ ` be able to find a safe candidate to use as a replacement.`
				+ ` Please see the spec for Lang.getNonConflictingChar.`
				);
			}
			return this.lang;
		});
	}

	/**
	 *
	 */
	public async reset(): Promise<void> {
		// Reset the grid and event record:
		await super.reset();

		this.#currentFreeHealth = 0.0;
		this.#freeHealthTiles.clear();

		// Reset hit-counters in the current language:
		// This must be done before shuffling so that the previous
		// history of shuffle-ins has no effects on the new pairs.
		await this.#langImportPromise;
		this.lang.reset();
		// Shuffle everything:
		this.grid.shuffledForEachTile((tile) => {
			tile.setLangCharSeqPair(this.dryRunShuffleLangCharSeqAt(tile));
		});

		// Reset and spawn players:
		this.teams.forEach((team) => team.reset());
		const spawnPoints = this.grid.static.getSpawnCoords(
			this.teams.map((team) => team.members.length),
			this.grid.dimensions,
		);
		this.teams.forEach((team, teamIndex) => {
			team.members.forEach((member, memberIndex) => {
				member.reset(this.grid.tile.at(spawnPoints[teamIndex][memberIndex]));
			});
		});
		this.scoreInfo.reset();

		return Promise.resolve();
	}

	/**
	 * @override
	 */
	protected _createArtifPlayer(desc: Player._CtorArgs<Player.FamilyArtificial>): ArtificialPlayer<S> {
		return ArtificialPlayer.of(this, desc);
	}


	/**
	 * **Important:** Nullifies the existing values at `tile` and does
	 * not consume the returned values, which must be done externally.
	 *
	 * @param targetTile
	 * The {@link Tile} to shuffle their {@link Lang.CharSeqPair}
	 * pair for.
	 *
	 * @param doCheckEmptyTiles
	 * Pass `true` when populating a grid which has been reset.
	 *
	 * @returns
	 * A {@link Lang.CharSeqPair} that can be used as a replacement
	 * for that currently being used by `tile`.
	 */
	public dryRunShuffleLangCharSeqAt(targetTile: Tile<S>, doCheckEmptyTiles: boolean = false): Lang.CharSeqPair {
		// First, clear values for the target tile so its current
		// (to-be-previous) values don't get unnecessarily avoided.
		targetTile.setLangCharSeqPair(Lang.CharSeqPair.NULL);

		let avoid: TU.RoArr<Lang.Seq> = this.grid
			.getDestsFromSourcesTo(targetTile.coord)
			.map((tile) => tile.langSeq);
		// ^ Note: An array of CharSeq from unique Tiles. It is okay
		// for those tiles to include `targetTile`, and it is okay for
		// those
		if (doCheckEmptyTiles) {
			const nullSeq = Lang.CharSeqPair.NULL.seq;
			avoid = avoid.filter((seq) => seq !== nullSeq);
		}
		return this.lang.getNonConflictingChar(avoid);
	}

	public get currentFreeHealth(): Player.Health {
		return this.#currentFreeHealth;
	}

	public get freeHealthTiles(): ReadonlySet<Tile<S>> {
		return this.#freeHealthTiles;
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
		sameReqOtherModDescs: TU.RoArr<TileModEvent<S>>,
	): TU.RoArr<TileModEvent<S>> | undefined {
		let healthToSpawn = this.averageFreeHealth - this.currentFreeHealth;
		if (healthToSpawn <= 0) return undefined;
		const retval: Array<TileModEvent<S>> = [];
		while (healthToSpawn > 0) {
			let tile: Tile<S>;
			do {
				tile = this.grid.tile.at(this.grid.getRandomCoord());
			} while ((() => {
				return tile.isOccupied
				// The below equality check is necessary to prevent counting bugs.
				|| retval.find((desc) => Coord.equals(tile.coord, desc.coord));
				// TODO.impl add other checks to improve distribution and reduce
				// crowding of freeHealth. Make sure it is sensitive to
				// `this.averageFreeHealthPerTile`.
			})());
			const tileHealthToAdd = Game.K.AVERAGE_HEALTH_TO_SPAWN_ON_TILE;
			if ((Math.random() < Game.K.HEALTH_UPDATE_CHANCE)) {
				let otherDesc: TileModEvent<S> | undefined;
				if (otherDesc = sameReqOtherModDescs.find((desc) => Coord.equals(tile.coord, desc.coord))) {
					otherDesc.newFreeHealth = (otherDesc.newFreeHealth ?? 0) + tileHealthToAdd;
				} else {
					retval.push({
						coord: tile.coord,
						lastKnownUpdateId: 1 + tile.lastKnownUpdateId,
						newCharSeqPair: undefined, // "do not change".
						newFreeHealth: tile.freeHealth + tileHealthToAdd,
					});
				}
			}
			healthToSpawn -= tileHealthToAdd;
		}
		return retval;
	}


	/**
	 * @override
	 */
	protected executeTileModEvent(
		desc: Readonly<TileModEvent<S>>,
		doCheckOperatorSeqBuffer: boolean = true,
	): Tile<S> {
		Object.freeze(desc);
		const tile = this.grid.tile.at(desc.coord);
		// NOTE: This assertion must be performed before executing
		// changes by making a supercall or else the previous state
		// will be gone.
		if (DEF.DevAssert && desc.lastKnownUpdateId !== (1 + tile.lastKnownUpdateId)) {
			// We literally just specified this in processMoveRequest.
			throw new RangeError("never");
		}
		this.#currentFreeHealth += desc.newFreeHealth! - tile.freeHealth;
		if (desc.newFreeHealth === 0) {
			this.#freeHealthTiles.delete(tile);
		} else {
			this.#freeHealthTiles.add(tile);
		}
		super.executeTileModEvent(desc, doCheckOperatorSeqBuffer);
		return tile;
	}

	/**
	 * Perform checks on an incoming event request for some action that
	 * a player can perform while the game is playing (ie. not paused
	 * or over).
	 *
	 * @param desc -
	 * @returns
	 * The player specified by the given ID, or undefined if the
	 * game is not playing, in which case the event request should
	 * be rejected.
	 */
	private managerCheckGamePlayingRequest(desc: PlayerGeneratedRequest): Player<S> | undefined {
		if (this.status !== Game.Status.PLAYING) {
			return undefined;
		}
		const player = this.players[desc.playerId];
		if (!player) {
			throw new Error("No such player exists.");
		}
		if (desc.playerLastAcceptedRequestId !== player.lastAcceptedRequestId) {
			throw new RangeError((desc.playerLastAcceptedRequestId < player.lastAcceptedRequestId)
			? ("Clients should not make requests until they have"
				+ " received my response to their last request.")
			: ("Client seems to have incremented the request ID"
				+ " counter on their own, which is is illegal.")
			);
		}
		return player;
	}


	/**
	 * @see PlayerMovementEvent
	 *
	 * Reject the request if `dest` is occupied, or if the specified
	 * player does not exist, or the client is missing updates for the
	 * destination they requested to move to, or the player is bubbling.
	 *
	 * @param desc
	 * A descriptor of the request describing the requester's views
	 * of critical parts of the game-state from their copy of the game
	 * state at the time of the request. Is modified to describe changes
	 * to be made.
	 */
	public processMoveRequest(desc: PlayerActionEvent.Movement<S>): void {
		const player = this.managerCheckGamePlayingRequest(desc);
		if (player === undefined) {
			// Reject the request:
			this.executePlayerMoveEvent(desc);
			return;
		}
		const dest = this.grid.tile.at(desc.destModDesc.coord);
		if (dest.isOccupied ||
			dest.lastKnownUpdateId !== desc.destModDesc.lastKnownUpdateId) {
			// The update ID check is not essential, but it helps
			// enforce stronger client-experience consistency: they cannot
			// move somewhere where they have not realized the `LangSeq` has
			// changed.
			this.executePlayerMoveEvent(desc); // Reject the request.
			return;
		}
		const moveIsBoost = (desc.moveType === Player.MoveType.BOOST);
		const newPlayerHealthValue
			= player.status.health
			+ (dest.freeHealth * (player.status.isDowned ? Game.K.HEALTH_EFFECT_FOR_DOWNED_PLAYER : 1.0))
			- (moveIsBoost ? this.healthCostOfBoost : 0);
		if (moveIsBoost && newPlayerHealthValue < 0) {
			// Reject a boost-type movement request if it would make
			// the player become downed (or if they are already downed):
			this.executePlayerMoveEvent(desc);
			return;
		}

		// Update stats records:
		const playerScoreInfo = this.scoreInfo.entries[player.playerId];
		playerScoreInfo.totalHealthPickedUp += dest.freeHealth;
		playerScoreInfo.moveCounts[desc.moveType] += 1;

		// Set response fields according to spec in `PlayerMovementEvent`:
		desc.playerLastAcceptedRequestId = (1 + player.lastAcceptedRequestId);
		desc.newPlayerHealth = {
			health: newPlayerHealthValue,
		};
		desc.destModDesc.lastKnownUpdateId = (1 + dest.lastKnownUpdateId);
		desc.destModDesc.newFreeHealth     = 0;
		desc.destModDesc.newCharSeqPair    = this.dryRunShuffleLangCharSeqAt(dest);
		desc.tileHealthModDescs = this.dryRunSpawnFreeHealth([desc.destModDesc]);

		// Accept the request, and trigger calculation
		// and enactment of the requested changes:
		desc.eventId = this.nextUnusedEventId;
		this.executePlayerMoveEvent(desc);
	}

	/**
	 *
	 * 1. Design decision: Change bubble mechanism:
	 * - Activates automatically and immediately upon players entering each others' (mutual) attack range, or by pressing space in the (mutual) attack range of other players.
	 * - When done automatically, health will be levelled-down enough to cause as many changes in downed-ness as possible by changing other opponents' health to -1 and teammates' health to 0.
	 * - If done by pressing space, health will be levelled further until the space-presser's health is at zero.
	 * - The player with the highest health upon contact, or the player who pressed space is considered the attacker.
	 *   - If the attacker is downed (ie. everyone in the interaction is downed), no changes should be made. Just short circuit.
	 *   - First, for each un-downed enemy (non-teammate) in range (sorted to evenly distribute downed-ness), the attacker will subtract that enemy's health+1 from its own, causing that enemy to become downed (health === -1 \< 0) until all enemies are downed, or any further whole-health-subtractions would cause it to become downed.
	 *   - If it still has more health, it does something similar for its teammates.
	 *
	 * @param sourceP
	 */
	private processPlayerContact(sourceP: Player<S>): PlayerActionEvent.Movement<S>["playerHealthModDescs"] {
		return undefined!;
	}


	/**
	 * @see PlayerActionEvent.Bubble
	 * @param desc - Is modified to describe changes to be made.
	 */
	public processBubbleRequest(desc: PlayerActionEvent.Bubble): void {
		// TODO.impl
		// - If successful, make sure to lower the health field.
		// - Make an abstract method in the OperatorPlayer class called in
		//   the top-level input processor for it to trigger this event.
		const bubbler = this.managerCheckGamePlayingRequest(desc);
		if (!bubbler) {
			// Reject the request:
			this.executePlayerBubbleEvent(desc);
			return;
		}
		desc.playerLastAcceptedRequestId = (1 + bubbler.lastAcceptedRequestId);

		// We are all go! Do it.
		desc.eventId = this.nextUnusedEventId;
		this.executePlayerBubbleEvent(desc);
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
JsUtils.protoNoEnum(GamepartManager, ["managerCheckGamePlayingRequest"]);
Object.freeze(GamepartManager);
Object.freeze(GamepartManager.prototype);