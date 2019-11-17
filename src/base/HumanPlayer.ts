import { LangSeq, Lang } from "src/Lang";
import { Tile } from "src/base/Tile";
import { Game } from "base/Game";
import { Player, PlayerId } from "base/Player";

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
    protected _seqBuffer: LangSeq;

    public constructor(game: Game, idNumber: PlayerId) {
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
        key = ((key !== null)
            ? this.lang.remapKey(key)
            : "" // Caller intends to refresh seqBuffer invariant.
        ) as string;
        // TODO: add check here for optimization purposes to short-circuit
        // if key does not match the LANG_SEQ_REGEXP ?

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
                    this.makeMovementRequest(matchletTiles[0]);
                } else {
                    // Operator typed part of the sequence for a UNT.
                    console.assert(matchletTiles.every(tile => tile.langSeq.length > newSeqBuffer.length));
                }
                break;
            }
        }
        if (newSeqBuffer.length === 0) {
            // Operator's new [seqBuffer] didn't match anything.
            this._seqBuffer = "";
            this.hostTile.visualBell();
        }
    }

    /**
     * @override
     */
    public moveTo(dest: Tile): void {
        super.moveTo(dest);
        // clear [seqBuffer]:
        this._seqBuffer = "";
    }



    public get seqBuffer(): LangSeq {
        return this._seqBuffer;
    }

    public get lang(): Lang {
        return this.game.lang;
    }

}
