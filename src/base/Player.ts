
/**
 * 
 */
abstract class Player {

    readonly game: Game;

    /**
     * An integer value unique to this [Player] in this [game]. If
     * this [Player] is human-controlled, this value is non-negative,
     * and otherwise, it is negative.
     */
    readonly     idNumber:  number;
    protected   _isAlive:   boolean;
    protected   _score:     number;
    protected   _hostTile:  Tile;
    protected   seqBuffer: string;



    public constructor(game: Game, idNumber: number) {
        this.game = game;
        this.idNumber = idNumber;
    }



    /**
     * Callback function invoked when the client presses a key while
     * the game's html element has focus. Because of how JavaScript
     * and also Node.js run in a single thread, this is an atomic
     * operation (implementation must not intermediately schedule any
     * other callbacks until all critical operations are complete).
     * 
     * @param event The object describing the [KeyboardEvent].
     */
    public processClientInput(event: KeyboardEvent) {
        if (false) {
            ;
        } else {
            this.seqBufferAcceptKey(event.key);
        }
    }

    /**
     * 
     * @param key 
     */
    public seqBufferAcceptKey(key: string) {
        let newSeqBuffer: LangSeq = this.seqBuffer + key;
        const neighbourSeqs: Array<LangSeq> = this.getUNT().map(t => t.langSeq);
        if (neighbourSeqs.length === 0) {
            return;
        }

        const matchletSeqs: Array<LangSeq> = neighbourSeqs.filter(seq => seq.startsWith(newSeqBuffer));
        if (matchletSeqs.length <= 1) {
            if (matchletSeqs.length === 1) {
                // the client typed part or all of the
                // sequence for a neighbouring [Tile].
                if (matchletSeqs[0] === newSeqBuffer) {
                    // they typed the whole thing (unless they are missing
                    // incoming updates from the server / [Game] manager).
                    this.seqBuffer = '';
                    this.game.processHumanMoveRequest(this, matchletSeqs[0]);
                }

            } else {
                // the client's new [seqBuffer] didn't match anything.
                this._hostTile.visualBell();
                // look for the longest suffixing substring of [newSeqBuffer]
                // that is a prefixing substring of any UNT's.
                const matchletSeqs: Array<LangSeq> = this.getUNT()
                        .map(t => t.langSeq)
                        .sort((seqA, seqB) => seqB.length - seqA.length);
                Object.freeze(matchletSeqs);
                for ( // loop through substring start offset of newSeqBuffer:
                    newSeqBuffer = newSeqBuffer.substring(1); // don't check full thing again
                    newSeqBuffer.length > 0;
                    newSeqBuffer = newSeqBuffer.substring(1)
                ) {
                    for (let i: number = 0; i < matchletSeqs.length; i++) {
                        if (matchletSeqs[i].startsWith(newSeqBuffer)) {
                            this.seqBuffer = newSeqBuffer;
                            newSeqBuffer = '';
                            break;
                        }
                    }
                }
            }

        } else {
            // there are multiple UNT's with possible
            // [LangSeq]s starting with [newSeqBuffer].
            console.assert(matchletSeqs.every(seq => seq.length > newSeqBuffer.length));
            this.seqBuffer = newSeqBuffer;
        }
    }



    public get pos(): Pos {
        return this._hostTile.pos;
    }

    public getUNT(): Array<Tile> {
        return this.game.getUNT(this.pos);
    }

}
