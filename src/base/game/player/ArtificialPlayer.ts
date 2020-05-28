import { Game } from "game/Game";
import type { Coord, Tile } from "floor/Tile";
import type { GamepartManager } from "game/gameparts/GamepartManager";

import type { Chaser } from './artificials/Chaser';

import { Player } from "./Player";


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

    private scheduledMovementCallbackId: number | NodeJS.Timeout;

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
            throw new TypeError("OnlineGames should be using regular Players instead.");
        }
    }

    /**
     * Returns a {@link Pos} representing an absolute coordinate (ie.
     * one that is relative to the {@link Game}'s origin position')
     * that this `ArtificialPlayer` intends to move toward in its next
     * movement request. Pos may contain non-integer coordinate values,
     * and it does not have to be inside the bounds of the {@link Grid}.
     */
    protected abstract computeDesiredDestination(): Coord<S>;

    protected abstract getNextMoveType(): Player.MoveType;

    /**
     * Units are in milliseconds.
     */
    protected abstract computeNextMovementTimer(): number;

    public _abstractNotifyThatGameStatusBecamePlaying(): void {
        this.movementContinueWithInitialDelay();
    }
    public _abstractNotifyThatGameStatusBecamePaused(): void {
        this.game.cancelTimeout(this.scheduledMovementCallbackId);
        this.scheduledMovementCallbackId = undefined!;
    }
    public _abstractNotifyThatGameStatusBecameOver(): void {
        this.game.cancelTimeout(this.scheduledMovementCallbackId);
        this.scheduledMovementCallbackId = undefined!;
    }

    private movementContinue(): void {
        this.makeMovementRequest(this.game.grid.getUntToward(
            this.coord, this.computeDesiredDestination()
        ), this.getNextMoveType());
        this.movementContinueWithInitialDelay();
    }

    private movementContinueWithInitialDelay(): void {
        // Schedule the next movement.
        this.scheduledMovementCallbackId = this.game.setTimeout(
            () => this.movementContinue(),
            this.computeNextMovementTimer(),
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

    export type FamilySpecificPart<F extends Player.Family> =
    ( F extends typeof Player.Family.CHASER ? Chaser.Behaviour
    : never
    );

    export const of = <S extends Coord.System>(
        game: GamepartManager<any,S>,
        playerDesc: Player._CtorArgs<Player.FamilyArtificial>,
    ): ArtificialPlayer<S> => {
        const familyId = playerDesc.familyId as Player.FamilyArtificial;
        return new (_Constructors[familyId])(game, playerDesc);
    };
}
// ArtificialPlayer gets frozen in PostInit after _Constructors get initialized.
