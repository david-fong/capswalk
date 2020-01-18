import { Lang } from "lang/Lang";
import { Tile, Coord } from "floor/Tile";
import { Player } from "./Player";


/**
 * Documentation will refer to the human controlling a {@link HumanPlayer}
 * as its "Operator".
 * 
 * @extends Player
 */
export abstract class OperatorPlayer<S extends Coord.System> extends Player<S> {

    /**
     * Invariant: always matches the prefix of the {@link LangSeq} of
     * an unoccupied neighbouring {@link Tile}.
     */
    private _seqBuffer: Lang.Seq;

    /**
     * @override {@link Player#reset}
     */
    public reset(spawnTile: Tile<S>): void {
        super.reset(spawnTile);
        this._seqBuffer = "";
    }



    /**
     * Callback function invoked when the Operator presses a key while
     * the game's html element has focus. Because of how JavaScript
     * and also Node.js run in a single thread, this is an atomic
     * operation (implementation must not intermediately schedule any
     * other task-relevant callbacks until all critical operations are
     * complete).
     * 
     * @param event - The object describing the `KeyboardEvent`.
     */
    public processClientInput(event: KeyboardEvent): void {
        if (false) {
            ;
        } else if (!this.requestInFlight) {
            // Only process movement-type input if the last request got
            // acknowledged by the Game Manager and the game is not paused.
            // TODO: check if game is paused? This means we either need to
            // add an event to signal pauses to clients (I don't like this
            // because it means delay), or we change this to allow sending
            // requests to the Game Manager even if the game is paused, and
            // leave it up to the Game Managaer to ignore the request.
            this.seqBufferAcceptKey(event.key);
        }
    }

    /**
     * Automaticaly makes a call to make a movement request if the
     * provided `key` completes the `LangSeq` of a UNT. Does not do
     * any checking regarding {@link HumanPlayer#requestInFlight}.
     * 
     * @param key
     * The pressed typable key as a string. Pass `null` to trigger a
     * refresh of the {@link HumanPlayer#_seqBuffer} to maintain its
     * invariant.
     */
    public seqBufferAcceptKey(key: string | null): void {
        const unts = this.tile.destsFrom().unoccupied.get;
        if (unts.length === 0) {
            // Every neighbouring `Tile` is occupied!
            // In this case, no movement is possible.
            return;
        }
        if (key) {
            key = this.lang.remapKey(key);
            if (!(Lang.Seq.REGEXP.test(key))) {
                throw new RangeError(`The implementation of input transformation`
                    + ` in the language \"${this.lang.name}\" did not follow the`
                    + ` rule of producing output matching the regular expression`
                    + ` \"${Lang.Seq.REGEXP.source}\".`
                );
            }
        } else {
            const possibleTarget = unts.find((tile) => tile.langSeq.startsWith(this.seqBuffer));
            if (!possibleTarget || possibleTarget.langSeq === this.seqBuffer) {
                this._seqBuffer = "";
            }
            return;
        }

        for ( // loop through substring start offset of newSeqBuffer:
            let newSeqBuffer: Lang.Seq = this.seqBuffer + key;
            newSeqBuffer.length;
            newSeqBuffer = newSeqBuffer.substring(1)
        ) {
            // look for the longest suffixing substring of `newSeqBuffer`
            // that is a prefixing substring of any UNT's.
            const possibleTarget = unts.find((tile) => tile.langSeq.startsWith(newSeqBuffer));
            if (possibleTarget) {
                this._seqBuffer = newSeqBuffer;
                if (possibleTarget.langSeq === newSeqBuffer) {
                    this.makeMovementRequest(possibleTarget);
                }
                return;
            }
        }
        // Operator's new `seqBuffer` didn't match anything.
        this._seqBuffer = "";
        this.hostTile.visualBell();
    }

    /**
     * Automatically clears the {@link HumanPlayer#seqBuffer}.
     * 
     * @override
     */
    public moveTo(dest: Player<S>["hostTile"]): void {
        // Clear my `seqBuffer` first:
        this._seqBuffer = "";
        super.moveTo(dest);
    }



    public get seqBuffer(): Lang.Seq {
        return this._seqBuffer;
    }

    public get lang(): Lang {
        return this.game.lang;
    }

}
