import { Lang, LangCharSeqPair } from "src/Lang";
import { Pos } from "src/Pos";
import { Tile } from "src/base/Tile";
import { Grid } from "src/base/Grid";
import { Player } from "src/base/Player";
import { HumanPlayer } from "src/base/HumanPlayer";
import { ArtificialPlayer } from "src/base/ArtificialPlayer";

/**
 * 
 * 
 * This class performs the majority of management over {@link Tile}
 * and {@link Player} objects. As a design choice, players can only join
 * a game before it starts, and actions such as changing the language or
 * difficulty require a restart. These actions that require a restart will
 * all be exposed to operators through a pre-game page. Other such actions
 * include: changing teams.
 * 
 * An overview of subclasses:
 * Both {@link ClientGame} and {@link OfflineGame} use {@link VisualTile}s
 * while {@link ServerGame} uses {@link ServerTile}s. {@link ClientGame}'s
 * record of the state of the game comes completely from {@link ServerGame}.
 * 
 * There are overlaps between what each implementation needs to do:
 * - Offline and Server games maintain and control the master-game-state.
 * - Offline and Client games display the game-state to an operator via browser and HTML.
 * - Client  and Server games use network operations to communicate.
 * 
 * @extends Grid
 */
export abstract class Game extends Grid {

    public lang: Lang;
    private readonly allHumanPlayers: Array<HumanPlayer>;
    private readonly allArtifPlayers: Array<ArtificialPlayer>;

    public constructor(height: number, width: number) {
        super(height, width);

        // TODO: set default language:
        this.lang = null;

        // TODO: setup allHumanPlayers?
        this.allHumanPlayers = [];
        this.allArtifPlayers = [];
    }

    /**
     * TODO: update this doc as behaviour is added.
     * 
     * Reset the grid and players.
     * 
     * @override {@link Grid#reset}
     */
    public reset(): void {
        super.reset();

        // Reset hit-counters in the current language:
        this.lang.reset();

        // Shuffle everything:
        this.grid.forEach(row => row.forEach(tile => {
            this.shuffleLangCharSeqAt(tile);
        }, this), this);

        // TODO: reset and respawn players:
        this.allHumanPlayers.forEach(player => player.reset());
        this.allArtifPlayers.forEach(player => player.reset());
    }



    /**
     * Helper for {@link Game#processMoveRequest}. Does not modify `tile`,
     * which must be done externally.
     * 
     * @param tile - The {@link Tile} to shuffle their {@link LangChar}-
     *          {@link LangSeq} pair for.
     * @returns A {@link LangCharSeqPair} that can be used as a replacement
     *          for that currently being used by `tile`.
     */
    private shuffleLangCharSeqAt(tile: Tile): LangCharSeqPair {
        return this.lang.getNonConflictingChar(
            this.getUNT(tile.pos).map(t => t.langSeq)
        );
    }

    /**
     * Call for a {@link HumanPlayer} whose {@link HumanPlayer#seqBuffer}
     *  should be that of the {@link Tile} at `dest`. Reject the request
     * by short-ciruiting if `dest` is occupied.
     * 
     * Should never be called by {@link ClientGame}.
     * 
     * @param playerId - 
     * @param destPos - 
     */
    public processMoveRequest(playerId: number, destPos: Pos): void {
        // TODO: get from artificial list for negative ID's.
        const player: Player = this.getHumanPlayer(playerId);
        const dest:   Tile   = this.getTileAt(destPos);
        if (dest.isOccupied()) {
            return;
        }
        if (player instanceof HumanPlayer) {
            ;
        } else if (player instanceof ArtificialPlayer) {
            ;
        } else {
            throw new TypeError("Unexpected argument type for \"player\" argument.");
        }

        // If the request was rejected, we would have short-circuited.
        // We are all go. Do it.
        this.processMoveExecute(new PlayerMovementEvent(
            playerId,
            dest.pos,
            this.shuffleLangCharSeqAt(dest),
        ));
    }

    /**
     * Update the {@link Game#grid}. Call either at the end of
     * {@link Game#processMoveRequest} if I am a {@link ServerGame} or
     * {@link OfflineGame}, or as an event callback if I am a
     * {@link ClientGame}.
     * 
     * It is essential that for these implementations, this method is
     * not scheduled for later since it is the "write" stage of that
     * critical operation. If I am a {@link ServerGame}, also notify
     * all clients of the movement event.
     * 
     * @param desc - A descriptor for the player-movement event.
     */
    protected processMoveExecute(desc: PlayerMovementEvent): void {
        const dest: Tile = this.getTileAt(desc.destPos);
        this.getHumanPlayer(desc.playerId).moveTo(dest);
        dest.setLangCharSeq(desc.newCharSeqPair);
    }



    protected getHumanPlayer(playerId: number): HumanPlayer {
        if (this.allHumanPlayers[playerId] === undefined) {
            throw new RangeError(`No player with id ${playerId} exists.`);
        }
        return this.allHumanPlayers[playerId];
    }

}





/**
 * 
 */
export class PlayerMovementEvent {

    public constructor(
        public readonly playerId: number,
        public readonly destPos: Pos,
        public readonly newCharSeqPair: LangCharSeqPair,
    ) {
        Object.freeze(this);
    }

}
