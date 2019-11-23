import { LangSeq, Lang } from "src/Lang";
import { Tile } from "src/base/Tile";
import { Game } from "base/Game";
import { PlayerId, Player } from "base/Player";

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
    private _seqBuffer: LangSeq;

    public constructor(game: Game, idNumber: PlayerId) {
        super(game, idNumber);
        if (this.idNumber <= 0) {
            throw new RangeError(`Id number for a human-operated`
                + ` Player must be strictly positive, but we were`
                + ` passed the value \"${idNumber}\"`
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
        } else if (this._isDowned && !(this.requestInFlight)) {
            // Process movement-type input if still alive and the
            // last request got acknowledged by the Game Manager.
            this.seqBufferAcceptKey(event.key);
        }
    }

    /**
     * Automaticaly makes a call to make a movement request if the
     * provided `key` completes the `LangSeq` of a UNT. Does not do
     * any checking regarding {@link HumanPlayer#requestInFlight}.
     * 
     * @param key - The pressed typable key as a string. Pass null to
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
            // TODO: add check here for optimization purposes to
            // short-circuit if key does not match the LANG_SEQ_REGEXP ?
        } else {
            key = ""; // Caller intends to refresh seqBuffer invariant.
        }

        let newSeqBuffer: LangSeq;
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
                        // Instead, clear the seqBuffer.
                        this._seqBuffer = "";
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
        super.moveTo(dest);
        // Clear `seqBuffer` this is done even if the movement was
        // somehow resolved by the Game Manager to be to my same
        // current position.
        this._seqBuffer = "";
    }



    public get seqBuffer(): LangSeq {
        return this._seqBuffer;
    }

    public get lang(): Lang {
        return this.game.lang;
    }

}
