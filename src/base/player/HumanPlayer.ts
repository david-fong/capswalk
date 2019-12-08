import { Lang } from "src/lang/Lang";
import { Tile } from "src/base/Tile";
import { Game } from "base/Game";
import { Player } from "src/base/player/Player";


/**
 * Documentation will refer to the human controlling a {@link HumanPlayer}
 * as its "Operator".
 * 
 * @extends Player
 */
export abstract class HumanPlayer extends Player {

    /**
     * Invariant: always matches the prefix of the {@link LangSeq} of
     * an unoccupied neighbouring {@link Tile}.
     */
    private _seqBuffer: Lang.Seq;

    public constructor(game: Game, desc: Player.ConstructorArguments) {
        super(game, desc);
        if (this.idNumber <= 0) {
            throw new RangeError(`The ID number for a human-operated player`
                + ` must be strictly greater than ${Player.Id.NULL}, but we`
                + ` were passed the value \"${this.idNumber}\".`
            );
        }
    }

    /**
     * @override {@link Player#reset}
     */
    public reset(): void {
        super.reset();
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
        } else if (!(this.requestInFlight)) {
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
     * @param key - The pressed typable key as a string. Pass `null` to
     *      trigger a refresh of the {@link HumanPlayer#_seqBuffer}
     *      to maintain its invariant.
     */
    public seqBufferAcceptKey(key: string | null): void {
        const unoccupiedNeighbouringTiles: Array<Tile> = this.getUNT();
        if (unoccupiedNeighbouringTiles.length === 0) {
            // Every neighbouring `Tile` is occupied!
            // In this case, no movement is possible.
            return;
        }
        if (key) {
            key = this.lang.remapKey(key);
            if (!(Lang.Seq.REGEXP.test(key))) {
                throw new Error(`The implementation of input transformation in`
                    + ` the language \"${this.lang.name}\" did not follow the`
                    + ` rule of producing output matching the regular expression`
                    + ` \"${Lang.Seq.REGEXP}\".`
                );
            }
        } else {
            key = ""; // Caller intends to refresh seqBuffer invariant.
        }

        let newSeqBuffer: Lang.Seq;
        for ( // loop through substring start offset of newSeqBuffer:
            newSeqBuffer = this.seqBuffer + key;
            newSeqBuffer.length > 0;
            newSeqBuffer = newSeqBuffer.substring(1)
        ) {
            // look for the longest suffixing substring of `newSeqBuffer`
            // that is a prefixing substring of any UNT's.
            const matchletTiles: ReadonlyArray<Tile> = unoccupiedNeighbouringTiles
                    .filter((tile) => tile.langSeq.startsWith(newSeqBuffer));
            if (matchletTiles.length > 0) {
                // Found a suffix of newSeqBuffer that prefixes a UNT's
                // sequence. Update seqBuffer field to use newSeqBuffer:
                this._seqBuffer = newSeqBuffer;
                if (matchletTiles.length === 1 &&
                    matchletTiles[0].langSeq === newSeqBuffer) {
                    if (key) {
                        // Operator typed the `LangSeq` of a UNT (unless they are
                        // missing incoming updates from the server / Game Manager).
                        this.makeMovementRequest(matchletTiles[0]);
                    } else {
                        // Refreshing seqBuffer due to external events and found a
                        // new completion. Probably, another player moved near me,
                        // and the shuffle-in happened to complete something else
                        // I was trying to type. In this case, don't try to move.
                        // Instead, break the loop in a way that clears the seqBuffer.
                        newSeqBuffer = "";
                    }
                }
                // Stop searching through suffixes of newSeqBuffer:
                break;
            }
        }
        if (newSeqBuffer.length === 0) {
            // Operator's new `seqBuffer` didn't match anything.
            this._seqBuffer = "";
            this.hostTile.visualBell();
        }
    }

    /**
     * Automatically clears the {@link HumanPlayer#seqBuffer}.
     * 
     * @override
     */
    public moveTo(dest: Tile): void {
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
