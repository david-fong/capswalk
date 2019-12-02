import { Pos, Tile } from "src/base/Tile";
import { Game } from "src/base/Game";
import { ClientGame } from "src/client/ClientGame";
import { Player } from "src/base/player/Player";
import { PlayerMovementEvent } from "src/events/PlayerMovementEvent";
import { ArtificialPlayerTypes as Types } from "src/base/player/artificials/Chaser";

/**
 * 
 * @extends Player
 */
export abstract class ArtificialPlayer extends Player {

    protected scheduledMovementCallbackId: number | NodeJS.Timeout;

    /**
     * See {@link ArtificialPlayer.of} for the public constructor interface.
     * 
     * @param game - 
     * @param desc - 
     */
    protected constructor(game: Game, desc: Player.ConstructorArguments) {
        super(game, desc);
        if (this.idNumber >= 0) {
            throw new RangeError(`ID number for an computationally-`
                + `controlled Player must be strictly negative, but`
                + ` we were passed the value \"${this.idNumber}\".`
            );
        }
        if (desc.teamNumbers.length > 1) {
            throw new Error("Artificial players should only be on a team"
                + " with other artificial players of the same type."
            );
        }
        if (desc.teamNumbers.some((teamNumber) => teamNumber >= 0)) {
            throw new RangeError("The static constant defining the team"
                + " number for an artificial player type must be strictly"
                + " negative."
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

    const Constructors = new Map<Player.TeamNumber, Function>([
        [ Types.Chaser.TEAM_NUMBER, Types.Chaser.prototype.constructor, ],
    ]);

    export const of = (game: Game, desc: Player.ConstructorArguments): ArtificialPlayer => {
        return new (Constructors.get(desc.teamNumbers[0])(game, desc));
    };

}
