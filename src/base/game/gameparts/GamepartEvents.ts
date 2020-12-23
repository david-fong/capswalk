import { JsUtils } from "defs/JsUtils";
import type { Game } from "../Game";
import type { Coord, Tile } from "floor/Tile";
import { StateChange } from "../StateChange"; export { StateChange };

import { GamepartBase } from "./GamepartBase";


/**
 * All events have two corresponding handler functions taking a
 * request descriptor object ("desc"):
 *
 * ### Request Processor
 *
 * The request processor is only used by the Game Manager. It decides
 * whether to accept or reject the request based on `desc` and may
 * throw exceptions on impossible arguments. It should not make any
 * changes to the game state. Instead, it is responsible to augment
 * `desc` with information describing what changes to the game state
 * must be made.
 *
 * ### Request Executor
 *
 * This takes the `desc` augmented by the request processor and enacts
 * all the described changes upon the game's state. If the Game Manager
 * is not local to the client (a server process), then this handler is
 * called at both the server and client.
 *
 * Updates the event record if the response is accepted.
 */
export abstract class GamepartEvents<G extends Game.Type, S extends Coord.System> extends GamepartBase<G,S> {

	public constructor(
		gameType: G,
		impl:     Game.ImplArgs,
		gameDesc: Game.CtorArgs<G,S>,
	) {
		super(gameType, impl, gameDesc);
		JsUtils.propNoWrite(this as GamepartEvents<G,S>, "eventRecordBitmap");
	}

	public reset(): Promise<void> {
		const superPromise = super.reset();

		// Since we didn't wait for the superPromise, return it.
		return superPromise;
	}


	/**
	 */
	protected commitTileMods(
		patch: Tile.Changes,
		doCheckOperatorSeqBuffer: boolean = true,
	): void {
		JsUtils.deepFreeze(patch);
		const tile = this.grid._getTileAt(patch.coord);

		if (patch.char !== undefined) {
			// Refresh the operator's `seqBuffer` (maintain invariant) for new CSP:
			if (doCheckOperatorSeqBuffer) {
				// ^Do this when non-operator moves into the the operator's vicinity.
				this.operators.forEach((op) => {
					if (this.grid._getTileDestsFrom(op.coord).includes(tile)) {
						op.seqBufferAcceptKey("");
					}
				});
			}
		}
		this.grid.editTile(patch);
	}

	/**
	 * Automatically lowers the {@link Player#requestInFlight} field
	 * for the requesting `Player` if the arriving event description
	 * is the newest one for the specified `Player`.
	 */
	protected commitStateChange(desc: StateChange.Res): void {
		JsUtils.deepFreeze(desc);
		const player = this.players[desc.initiator]!;

		if (desc.rejected) {
			player.requestInFlight = false;
			return; //⚡
		}

		desc.tiles.forEach((desc) => {
			this.commitTileMods(desc);
		});
		Object.entries(desc.players).forEach(([pid, changes]) => {
			const player = this.players[pid as unknown as number]!;
			player.status.health = changes.health;
			player.moveTo(changes.coord);
		});

	}
}
JsUtils.protoNoEnum(GamepartEvents, "nextUnusedEventId", "_recordEvent");
Object.freeze(GamepartEvents);
Object.freeze(GamepartEvents.prototype);