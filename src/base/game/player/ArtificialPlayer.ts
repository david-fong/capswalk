import { Game } from "game/Game";
import type { Coord, Tile } from "floor/Tile";
import type { GamepartManager } from "game/gameparts/GamepartManager";

export type { Coord, Tile };
export type { GamepartManager };

// Implementations:
import type { Chaser } from "./artificials/Chaser";

import { Player } from "./Player";
export { Player };


/**
 * Unlike {@link HumanPlayer}s, these are not guided by human input.
 * Instead, they are essentially defined by how often they move, and
 * where they decide to move toward each time they move.
 *
 * Can be paused and un-paused by the Game Manager.
 *
 * @extends Player
 */
export abstract class ArtificialPlayer<S extends Coord.System> extends Player<S> {

    declare public readonly game: GamepartManager<any,S>;

    private _nextMovementTimerMultiplier: number;

    private _scheduledMovementCallbackId: number | NodeJS.Timeout;

    /**
     * See {@link ArtificialPlayer.of} for the public constructor
     * interface.
     *
     * @param game -
     * @param desc -
     */
    protected constructor(game: GamepartManager<any,S>, desc: Player.CtorArgs) {
        super(game, desc);
        if (game.gameType === Game.Type.ONLINE) {
            throw TypeError("OnlineGames should be using regular Players instead.");
        }
    }

    /**
     * Returns a {@link Pos} representing an absolute coordinate (ie.
     * one that is relative to the {@link Game}'s origin position')
     * that this `ArtificialPlayer` intends to move toward in its next
     * movement request. Pos may contain non-integer coordinate values,
     * and it does not have to be inside the bounds of the {@link Grid}.
     */
    protected abstract computeDesiredDest(): Coord[S];

    protected abstract getNextMoveType(): Player.MoveType;

    /**
     * Units are in milliseconds.
     */
    protected abstract computeNextMovementTimer(): number;

    public _notifyGameNowPlaying(): void {
        this.delayedMovementContinue();
    }
    public _notifyGameNowPaused(): void {
        this.game.cancelTimeout(this._scheduledMovementCallbackId);
        this._scheduledMovementCallbackId = undefined!;
    }
    public _notifyGameNowOver(): void {
        this.game.cancelTimeout(this._scheduledMovementCallbackId);
        this._scheduledMovementCallbackId = undefined!;
    }

    /**
     * Executes a single movement and then calls `delayedMovementContinue`.
     */
    private movementContinue(): void {
        const desiredDest = this.computeDesiredDest();
        // This is a little different than how human players experience
        // "penalties" when moving to tiles with long language-sequences-
        // humans must pay the penalty before landing on the tile, but
        // in the implementation here, it's much easier to simulate such
        // a penalty if it applies _after_ landing on the tile.
        this._nextMovementTimerMultiplier = this.game.grid.tile.at(desiredDest).langSeq.length;

        this.makeMovementRequest(
            this.game.grid.getUntToward(
                desiredDest,
                this.coord,
            ),
            this.getNextMoveType(),
        );
        // Schedule a task to do this again:
        this.delayedMovementContinue();
    }

    /**
     * Schedules a call to `movementContinue`.
     */
    private delayedMovementContinue(): void {
        // Schedule the next movement.
        this._scheduledMovementCallbackId = this.game.setTimeout(
            this.movementContinue.bind(this),
            this.computeNextMovementTimer() * this._nextMovementTimerMultiplier,
            // * Callback function arguments go here.
        );
        return;
    }
}
export namespace ArtificialPlayer {

    export declare const _Constructors: Readonly<{
        [ F in Player.FamilyArtificial ]: {
            new<S extends Coord.System>(
                game: GamepartManager<any,S>, desc: Player._CtorArgs<F>
            ): ArtificialPlayer<S>;
        };
    }>;

    export interface FamilySpecificPart {
        [Player.Family.CHASER]: Chaser.Behaviour;
    }

    export const of = <S extends Coord.System>(
        game: GamepartManager<any,S>,
        playerDesc: Player._CtorArgs<Player.FamilyArtificial>,
    ): ArtificialPlayer<S> => {
        const familyId = playerDesc.familyId as Player.FamilyArtificial;
        return new (_Constructors[familyId])(game, playerDesc);
    };
}
// ArtificialPlayer is frozen in PostInit after _Constructors get initialized.