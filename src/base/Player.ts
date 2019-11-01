
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
    protected   seqBuffer:  string;



    public constructor(game: Game, idNumber: number) {
        this.game = game;
        this.idNumber = idNumber;
    }

    public reset(): void {
        this._isAlive   = true;
        this._score     = 0;
        this._hostTile  = null;
        this.seqBuffer  = '';
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
                if (matchletSeqs.length === 1 && matchletSeqs[0] === newSeqBuffer) {
                    // client typed the whole thing (unless they are missing
                    // incoming updates from the server / [Game] manager).
                    this.seqBuffer = '';
                    this.game.processHumanMoveRequest(this, matchletSeqs[0]);
                } else {
                    // client typed part of the sequence for a neighbouring [Tile].
                    this.seqBuffer = newSeqBuffer;
                }
                break;
            }
        }
        if (newSeqBuffer.length === 0) {
            // the client's new [seqBuffer] didn't match anything.
            this.seqBuffer = '';
            this._hostTile.visualBell();
        }
    }



    public get pos(): Pos {
        return this._hostTile.pos;
    }

    public get score(): number {
        return this._score;
    }

    public getUNT(): Array<Tile> {
        return this.game.getUNT(this.pos);
    }

}
