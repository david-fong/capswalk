import { Game } from "game/Game";
import type { Coord, Tile } from "floor/Tile";
import type { GameManager } from "game/__gameparts/Manager";

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

    declare public readonly game: GameManager<any,S>;

    private scheduledMovementCallbackId: number | NodeJS.Timeout;

    /**
     * See {@link ArtificialPlayer.of} for the public constructor
     * interface.
     *
     * @param game -
     * @param desc -
     */
    protected constructor(game: GameManager<any,S>, desc: Player.CtorArgs) {
        super(game, desc);
        if (game.gameType === Game.Type.CLIENT) {
            throw new TypeError("ClientGames should be using regular Players instead.");
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

    /**
     * Units are in milliseconds.
     */
    protected abstract computeNextMovementTimer(): number;

    public __abstractNotifyThatGameStatusBecamePlaying(): void {
        this.movementContinueWithInitialDelay();
    }
    public __abstractNotifyThatGameStatusBecamePaused(): void {
        this.game.cancelTimeout(this.scheduledMovementCallbackId);
        this.scheduledMovementCallbackId = undefined!;
    }
    public __abstractNotifyThatGameStatusBecameOver(): void {
        this.game.cancelTimeout(this.scheduledMovementCallbackId);
        this.scheduledMovementCallbackId = undefined!;
    }

    private movementContinue(): void {
        this.makeMovementRequest(this.game.grid.getUntToward(
            this.coord, this.computeDesiredDestination()
        ));
        this.movementContinueWithInitialDelay();
    }

    private movementContinueWithInitialDelay(): void {
        // Schedule the next movement.
        this.scheduledMovementCallbackId = this.game.setTimeout(
            this.movementContinue,
            this.computeNextMovementTimer(),
            // * Callback function arguments go here.
        );
        return;
    }

}



export namespace ArtificialPlayer {

    export declare const __Constructors: Readonly<Record<
        Exclude<Player.Family, typeof Player.Family.HUMAN>,
        typeof ArtificialPlayer
    >>;

    export const of = <S extends Coord.System>(
        game: Readonly<GameManager<any,S>>,
        playerDesc: Readonly<Player.CtorArgs>,
    ): ArtificialPlayer<S> => {
        return new (__Constructors[playerDesc.familyId])(game, playerDesc);
    };

}
// ArtificialPlayer gets frozen in PostInit after __Constructors get initialized.
