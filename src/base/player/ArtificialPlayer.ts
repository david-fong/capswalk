import { Pos, Tile } from "src/base/Tile";
import { Game } from "src/base/Game";
import { ClientGame } from "src/client/ClientGame";
import { PlayerId, Player } from "src/base/player/Player";
import { PlayerMovementEvent } from "src/events/PlayerMovementEvent";

/**
 * 
 * @extends Player
 */
export abstract class ArtificialPlayer extends Player {

    protected scheduledMovementCallbackId: number | NodeJS.Timeout;

    public constructor(game: Game, idNumber: PlayerId) {
        super(game, idNumber);
        if (this.idNumber >= 0) {
            throw new RangeError(`ID number for an computationally-`
                + `controlled Player must be strictly negative, but`
                + ` we were passed the value \"${idNumber}\".`
            );
        }
        if (game instanceof ClientGame) {
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
    protected abstract computeDesiredDestination(): Pos;

    protected abstract computeNextMovementTimer(): number;



    /**
     * @returns TODO
     * 
     * Note: the current position of this `ArtificialPlayer` is
     * always an option when everything adjacent to it is occupied.
     * 
     * @param intendedDest - 
     */
    protected getUntToward(intendedDest: Pos): Tile {
        const unfavorableness = (tile: Tile): number => {
            return intendedDest.sub(tile.pos).twoNorm;
        };
        const options: Array<Tile> = this.getUNT();
        options.push(this.hostTile);
        options.sort((tileA, TileB) => {
            return unfavorableness(tileA) - unfavorableness(TileB);
        });
        // choose one of the two most favorable using some randomness
        // weighted to make the long term path of movement to follow
        // a non-45-degree-angled line toward `intendedDest`.
        // TODO
        return undefined;
    }

    /**
     * Unlike {@link HumanPlayer}s, `ArtificialPlayer`s are managed
     * directly by the Game Manager, so there is no need to make a
     * request via socket.io.
     * 
     * @override
     */
    protected abstractMakeMovementRequest(dest: Tile): void {
        this.game.processMoveRequest(
            new PlayerMovementEvent(
                this.idNumber,
                this.lastAcceptedRequestId,
                dest,
            ),
        );
    }

}



export namespace ArtificialPlayer {

    export enum Type {
        CHASER,
        NOMMER,
        RUNNER,
    }

    export const Constructors = new Map<Type, Function>([
        [ Type.CHASER, undefined, ],
    ]);

}
