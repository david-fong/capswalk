
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
abstract class Game extends Grid {

    protected lang: Lang;
    private readonly allHumanPlayers: Array<Player>;

    public constructor(height: number, width: number) {
        super(height, width);

        // TODO: set default language:
        this.lang = null;

        // TODO: setup allHumanPlayers?
    }

    /**
     * TODO: update this doc as behaviour is added.
     * 
     * Reset players.
     * 
     * @override `Grid::reset`
     */
    public reset(): void {
        super.reset();

        // Shuffle everything:
        this.grid.forEach(row => row.forEach(t => {
            this.shuffleLangCharSeqAt(t)
        }, this), this);

        // TODO: reset and respawn players:

        // TODO: send the state of the entire grid to all clients? no.
        // that's only for the server implementation.
    }



    /**
     * Does not modify `tile`. This must be done externally.
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
     * `Tile` provided as `dest`. Reject the request if `dest` is occupied.
     * 
     * Should never be called by `ClientGame`.
     * 
     * @param player 
     * @param dest 
     */
    public processMoveRequest(player: Player, dest: Tile | Pos): void {
        if (dest instanceof Pos) dest = this.getTileAt(dest);
        if (dest.isOccupied()) {
            throw new Error("Only one player can occupy a tile at a time.")
        }
        if (player instanceof HumanPlayer) {
            if (player.seqBuffer !== dest.langSeq) {
                // player movement request is invalid.
                return;
            }
        } else if (player instanceof ArtificialPlayer) {
            ;
        } else {
            throw new TypeError("Unexpected argument type for 'player' argument.");
        }

        // If the request was rejected, we would have short-circuited.
        // We are all go. Do it.
        this.processMoveExecute(new PlayerMovementEvent(
            player.idNumber,
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
        this.allHumanPlayers[desc.playerId].moveTo(dest);
        dest.setLangCharSeq(desc.newCharSeqPair);
    }

}





/**
 * 
 */
class PlayerMovementEvent {

    public constructor(
        public readonly playerId: number,
        public readonly destPos: Pos,
        public readonly newCharSeqPair: LangCharSeqPair,
    ) {
        Object.freeze(this);
    }

}
