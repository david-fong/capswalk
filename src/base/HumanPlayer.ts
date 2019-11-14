import { LangSeq, Lang } from "src/Lang";
import { Tile } from "src/base/Tile";
import { Game } from "base/Game";
import { Player } from "base/Player";

/**
 * Documentation will refer to the human controlling a {@link HumanPlayer}
 * as its "Operator".
 * 
 * @extends Player
 */
export abstract class HumanPlayer extends Player {

    protected _seqBuffer: LangSeq;

    public constructor(game: Game, idNumber: number) {
        super(game, idNumber);
        if (this.idNumber < 0) {
            throw new Error(`Id number for a human-operated Player must be`
                + `non-negative. Was passed an idNumber equal to ${idNumber}.`
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
        } else if (this._isAlive) {
            // process movement-type input if still alive.
            this.seqBufferAcceptKey(event.key);
        }
    }

    /**
     * 
     * @param key - The pressed typable key as a string.
     */
    public seqBufferAcceptKey(key: string): void {
        const unoccupiedNeighbouringTiles: Array<Tile> = this.getUNT();
        if (unoccupiedNeighbouringTiles.length === 0) {
            // Every neighbouring `Tile` is occupied!
            // In this case, no movement is possible.
            return;
        }
        key = this.lang.remapKey(key);
        if (key === null) {
            return;
        }
        let newSeqBuffer: LangSeq;
        for ( // loop through substring start offset of newSeqBuffer:
            newSeqBuffer = this._seqBuffer + key;
            newSeqBuffer.length > 0;
            newSeqBuffer = newSeqBuffer.substring(1)
        ) {
            // look for the longest suffixing substring of [newSeqBuffer]
            // that is a prefixing substring of any UNT's.
            // TODO: change this to make it always be the prefix of a seq
            // in their game's lang- not just of UNT's.
            const matchletTiles: Array<Tile> = unoccupiedNeighbouringTiles
                    .filter(t => t.langSeq.startsWith(newSeqBuffer));
            Object.freeze(matchletTiles);
            if (matchletTiles.length > 0) {
                this._seqBuffer = newSeqBuffer;
                if (matchletTiles.length === 1 && matchletTiles[0].langSeq === newSeqBuffer) {
                    // Operator typed the [LangSeq] of a UNT (unless they are
                    // missing incoming updates from the server / [Game] manager).
                    this.makeMovementRequest(matchletTiles[0].pos);
                    // clear [seqBuffer]:
                    this._seqBuffer = "";
                } else {
                    // Operator typed part of the sequence for a UNT.
                    console.assert(matchletTiles.every(t => t.langSeq.length > newSeqBuffer.length));
                }
                break;
            }
        }
        if (newSeqBuffer.length === 0) {
            // Operator's new [seqBuffer] didn't match anything.
            this._seqBuffer = "";
            this._hostTile.visualBell();
        }
    }



    public get seqBuffer(): LangSeq {
        return this._seqBuffer;
    }

    public get lang(): Lang {
        return this.game.lang;
    }

}
