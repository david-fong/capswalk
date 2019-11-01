
/**
 * 
 */
abstract class HumanPlayer extends Player {

    protected   seqBuffer:  string;

    public constructor(game: Game, idNumber: number) {
        super(game, idNumber);
    }

    public reset() {
        super.reset();
        this.seqBuffer  = '';
    }



    /**
     * Callback function invoked when the operator presses a key while
     * the game's html element has focus. Because of how JavaScript
     * and also Node.js run in a single thread, this is an atomic
     * operation (implementation must not intermediately schedule any
     * other task-relevant callbacks until all critical operations are
     * complete).
     * 
     * @param event The object describing the `KeyboardEvent`.
     */
    public processClientInput(event: KeyboardEvent) {
        if (false) {
            ;
        } else if (this._isAlive) {
            // process movement-type input if still alive.
            this.seqBufferAcceptKey(event.key);
        }
    }

    /**
     * 
     * @param key 
     */
    public seqBufferAcceptKey(key: string) {
        
        const neighbourSeqs: Array<LangSeq> = this.getUNT().map(t => t.langSeq);
        if (neighbourSeqs.length === 0) {
            return;
        }
        
        let newSeqBuffer: LangSeq;
        for ( // loop through substring start offset of newSeqBuffer:
            newSeqBuffer = this.seqBuffer + key;
            newSeqBuffer.length > 0;
            newSeqBuffer = newSeqBuffer.substring(1)
        ) {
            // look for the longest suffixing substring of [newSeqBuffer]
            // that is a prefixing substring of any UNT's.
            const matchletSeqs: Array<LangSeq> = neighbourSeqs
                    .filter(seq => seq.startsWith(newSeqBuffer));
            Object.freeze(matchletSeqs);
            if (matchletSeqs.length > 0) {
                this.seqBuffer = newSeqBuffer;
                if (matchletSeqs.length === 1 && matchletSeqs[0] === newSeqBuffer) {
                    // Operator typed the [LangSeq] of a UNT (unless they are
                    // missing incoming updates from the server / [Game] manager).
                    this.makeMovementRequest();
                    // clear [seqBuffer]:
                    this.seqBuffer = '';
                } else {
                    // Operator typed part of the sequence for a UNT.
                    console.assert(matchletSeqs.every(seq => seq.length > newSeqBuffer.length));
                }
                break;
            }
        }
        if (newSeqBuffer.length === 0) {
            // Operator's new [seqBuffer] didn't match anything.
            this.seqBuffer = '';
            this._hostTile.visualBell();
        }
    }

}
