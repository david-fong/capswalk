import { Pos, Tile } from "src/base/Tile";
import { OfflineGame } from "src/offline/OfflineGame";
import { ServerGame } from "src/server/ServerGame";
import { Player } from "src/base/Player";
import { PlayerMovementEvent } from "src/base/PlayerMovementEvent";

/**
 * TODO: this will be a little tricky to reuse code:
 * Offline implementation needs to use browser versions of setTimeout
 * and cancelTimeout, which have different cancelId types than the
 * Node.js versions. See if this can be handled with Typescript's
 * conditional types or with Generics. If things get any more
 * complicated, look into using Typescript Mixins.
 * 
 * @extends Player
 */
export abstract class ArtificialPlayer extends Player {

    /**
     * @override
     */
    public readonly game: OfflineGame | ServerGame;

    protected scheduledMovementCallbackId: number;

    /**
     * Returns a {@link Pos} representing an absolute coordinate (ie.
     * one that is relative to the {@link Game}'s origin position')
     * that this `ArtificialPlayer` intends to move toward in its next
     * movement request. Pos may contain non-integer coordinate values,
     * and it does not have to be inside the bounds of the {@link Grid}.
     */
    public abstract computeDesiredDestination(): Pos;

    public abstract computeNextMovementTimer(): number;

    /**
     * @returns TODO
     * 
     * Note: the current position of this `ArtificialPlayer` is
     * always an option when everything adjacent to it is occupied.
     * 
     * @param intendedDest - 
     */
    protected getUntToward(intendedDest: Pos): Tile {
        const unfavorableness: Function = (tile: Tile): number => {
            return intendedDest.sub(tile.pos).twoNorm;
        };
        const options: Array<Tile> = this.getUNT();
        options.push(this.hostTile);
        options.sort((tileA, TileB) => {
            return unfavorableness(tileA.pos)
                    - unfavorableness(TileB.pos);
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
    public abstractMakeMovementRequest(dest: Tile): void {
        this.game.processMoveRequest(
            new PlayerMovementEvent(
                this.idNumber,
                this.lastAcceptedRequestId,
                dest,
            )
        );
    }

}
