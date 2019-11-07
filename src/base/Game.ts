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
 * This class performs the majority of management over `Tile` and
 * `Player` objects.
 * 
 * An overview of subclasses:
 * Both `ClientGame` and `OfflineGame` use `VisualTile`s, while
 * `ServerGame` uses `ServerTile`s. `ClientGame`'s record of the
 * state of the game comes completely from `ServerGame`.
 * 
 * @extends Grid
 */
export abstract class Game extends Grid {

    private lang: Lang;
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
     * @override `Grid::reset`
     */
    public reset(): void {
        super.reset();

        // Reset hit-counters in the current language:
        this.lang.reset();

        // Shuffle everything:
        this.grid.forEach(row => row.forEach(t => {
            this.shuffleLangCharSeqAt(t);
        }, this), this);

        // TODO: reset and respawn players:
        this.allHumanPlayers.forEach(player => player.reset());
        this.allArtifPlayers.forEach(player => player.reset());
    }



    /**
     * Does not modify `tile`. This must be done externally. Gets called
     * by `::processMoveRequest`.
     * 
     * @param tile The `Tile` to shuffle their `LangChar`-`LangSeq` pair for.
     */
    private shuffleLangCharSeqAt(tile: Tile): LangCharSeqPair {
        return this.lang.getNonConflictingChar(
            this.getUNT(tile.pos).map(t => t.langSeq)
        );
    }

    /**
     * Call for a `HumanPlayer` whose `seqBuffer` should be that of the
     * `Tile` at `dest`. Reject the request if `dest` is occupied.
     * 
     * Should never be called by `ClientGame`.
     * 
     * @param player 
     * @param destPos 
     */
    public processMoveRequest(playerId: number, destPos: Pos): void {
        // TODO: get from artificial list for negative ID's.
        const player: Player = this.getHumanPlayer(playerId);
        const dest:   Tile   = this.getTileAt(destPos);
        if (dest.isOccupied()) {
            throw new Error("Only one player can occupy a tile at a time.");
        }
        if (player instanceof HumanPlayer) {
            ;
        } else if (player instanceof ArtificialPlayer) {
            ;
        } else {
            throw new TypeError("Unexpected argument type for 'player' argument.");
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
     * Update the `grid`. Call either at the end of `::processMoveRequest`
     * if I am a `ServerGame` or `OfflineGame`. It is essential that for
     * these implementations, this method is not scheduled for later since
     * it is the 'write' stage of that critical operation. Otherwise, if
     * I am a `ClientGame`, bind this as the callback function of an event
     * notification from the server. If I am a `ServerGame`, also notify
     * all clients of the movement event.
     * 
     * @param desc A descriptor for the player-movement event.
     */
    protected processMoveExecute(desc: PlayerMovementEvent): void {
        const dest: Tile = this.getTileAt(desc.destPos);
        this.getHumanPlayer(desc.playerId).moveTo(dest);
        dest.setLangCharSeq(desc.newCharSeqPair);
    }



    protected getHumanPlayer(playerId: number): HumanPlayer {
        if (playerId < 0 || playerId >= this.allHumanPlayers.length) {
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
