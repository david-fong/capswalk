import { Coord, Tile } from "floor/Tile";
import { Game } from "game/Game";
import { Player } from "./Player";
import { PlayerMovementEvent } from "game/events/PlayerMovementEvent";

import { Chaser } from "./artificials/Chaser";


/**
 * Unlike {@link HumanPlayer}s, these are not guided by human input.
 * Instead, they are essentially defined by how often they move, and
 * where they decide to move toward each time they move.
 *
 * Can be paused and un-paused by the Game Manager.
 *
 * @extends Player
 */
// TODO: if add abstract method hooks for events like player "collision",
// then add this to the above documentation.
export abstract class ArtificialPlayer<S extends Coord.System> extends Player<S> {

    private scheduledMovementCallbackId: number | NodeJS.Timeout;

    /**
     * See {@link ArtificialPlayer.of} for the public constructor interface.
     *
     * @param game -
     * @param desc -
     */
    protected constructor(game: Game<any,S>, desc: Player.CtorArgs) {
        super(game, desc);
        if (game.gameType === Game.Type.CLIENT) {
            throw new TypeError("ClientGames should be using PuppetPlayers instead.");
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

    protected abstract computeNextMovementTimer(): number;



    /**
     * Unlike {@link HumanPlayer}s, `ArtificialPlayer`s are managed
     * directly by the Game Manager, so there is no need to make a
     * request via socket.io.
     *
     * @override
     */
    protected abstractMakeMovementRequest(dest: Player<S>["hostTile"]): void {
        this.game.processMoveRequest(
            new PlayerMovementEvent(
                this.playerId,
                this.lastAcceptedRequestId,
                dest,
            ),
        );
    }

}



export namespace ArtificialPlayer {

    const Constructors = Object.freeze(<const>{
        [ Player.Family.CHASER ]: Chaser,
    }) as Readonly<Record<
        Exclude<Player.Family, typeof Player.Family.HUMAN>,
        typeof ArtificialPlayer
    >>; // Type Assertion.

    export const of = <S extends Coord.System>(
        game: Readonly<Game<any,S>>,
        playerDesc: Readonly<Player.CtorArgs>,
    ): ArtificialPlayer<S> => {
        return new (Constructors[playerDesc.playerId.family])(game, playerDesc);
    };

}
