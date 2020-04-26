import { Lang } from "lang/Lang";
import { Game } from "game/Game";

import type { Coord, Tile } from "floor/Tile";
import type { VisibleTile } from "floor/VisibleTile";
import type { VisiblePlayerStatus } from "./VisiblePlayerStatus";
import type { GameBase } from "game/__gameparts/Base";

import { Player } from "./Player";


/**
 *
 * @extends Player
 */
export class OperatorPlayer<S extends Coord.System> extends Player<S> {

    /**
     * @override
     */
    declare public readonly game: GameBase<(Game.Type.OFFLINE|Game.Type.ONLINE),S>;

    /**
     * @override
     */
    declare public readonly hostTile: VisibleTile<S>;

    /**
     * @override
     */
    declare public readonly status: VisiblePlayerStatus<S>;

    /**
     * Invariant: always matches the prefix of the {@link LangSeq} of
     * an unoccupied neighbouring {@link Tile}.
     */
    #seqBuffer: Lang.Seq;

    private readonly langRemappingFunc: {(input: string): string};

    private prevCoord: Coord<S>;


    public constructor(game: GameBase<any,S>, desc: Readonly<Player.CtorArgs>) {
        super(game, desc);
        this.langRemappingFunc = Lang.RemappingFunctions[desc.langName];
    }

    /**
     * @override {@link Player#reset}
     */
    public reset(spawnTile: Tile<S>): void {
        super.reset(spawnTile);
        this.prevCoord = spawnTile.coord;
        this.#seqBuffer = "";
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
    public processKeyboardInput(event: KeyboardEvent): void {
        if (false) {
            return;
        // @ Above: Conditional handlers for actions that are valid
        // even when the game is over or paused.
        // ==========================================================
        } else if (this.game.status !== Game.Status.PLAYING) return;
        if (!this.requestInFlight) {
            console.log("no request in flight");
            // Only process movement-type input if the last request got
            // acknowledged by the Game Manager and the game is playing.
            if (event.keyCode === 32) {
                // TODO.design: this should cost health... add an argument to
                // makeMovementRequest? An enum saying how the movement should
                // be "charged" / its "cost-type" in health? The cost should
                // be proportional to `GameManager.averageFreeHealthPerTile`.
                // TODO.learn why isn't TypeScript able to figure the below line out?
                if (!this.coord.equals(this.prevCoord as any)) {
                    this.makeMovementRequest(this.game.grid.getUntAwayFrom(
                        this.coord, this.prevCoord,
                    ), Player.MoveType.BOOST);
                }
            } else if (event.key.length === 1) {
                // TODO.design is the above condition okay? will any
                // languages require different behaviour?
                this.seqBufferAcceptKey(event.key);
            }
        }
    }

    /**
     * Automatically makes a call to make a movement request if the
     * provided `key` completes the `LangSeq` of a UNT. Does not do
     * any checking regarding {@link OperatorPlayer#requestInFlight}.
     *
     * @param key
     * The pressed typeable key as a string. Pass an empty string to
     * trigger a refresh of the {@link OperatorPlayer#_seqBuffer} to
     * maintain its invariant.
     */
    public seqBufferAcceptKey(key: string | undefined): void {
        const unts = this.tile.destsFrom().unoccupied.get;
        if (unts.length === 0) {
            // Every neighbouring `Tile` is occupied!
            // In this case, no movement is possible.
            return;
        }
        if (key) {
            key = this.langRemappingFunc(key);
            if (!(Lang.Seq.REGEXP.test(key))) {
                // throw new RangeError(`The implementation of input transformation`
                // + ` in the currently selected language did not follow the rule`
                // + ` of producing output matching the regular expression`
                // + ` \"${Lang.Seq.REGEXP.source}\".`
                // );
                return;
            }
        } else {
            const possibleTarget = unts.find((tile) => tile.langSeq.startsWith(this.seqBuffer));
            if (!possibleTarget) {
                // If the thing I was trying to get to is gone, clear the buffer.
                this.#seqBuffer = "";
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
                this.#seqBuffer = newSeqBuffer;
                if (possibleTarget.langSeq === newSeqBuffer) {
                    this.makeMovementRequest(possibleTarget, Player.MoveType.NORMAL);
                }
                return;
            }
        }
        // Operator's new `seqBuffer` didn't match anything.
        this.#seqBuffer = "";
        this.hostTile.visualBell();
    }

    /**
     * Automatically clears the {@link OperatorPlayer#seqBuffer}.
     *
     * @override
     */
    public moveTo(dest: Tile<S>): void {
        // Clear my `seqBuffer` first:
        this.#seqBuffer = "";
        this.prevCoord = this.coord;
        super.moveTo(dest);
    }


    public get seqBuffer(): Lang.Seq {
        return this.#seqBuffer;
    }

}
Object.freeze(OperatorPlayer);
Object.freeze(OperatorPlayer.prototype);
