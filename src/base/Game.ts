
/**
 * 
 * 
 * This class performs the majority of management over `Tile` and
 * `Player` objects.
 * 
 * An overview of subclasses:
 * Both `ClientGame` and `OfflineGame` use `VisualTile`s, while
 * `ServerGame` uses `ServerTile`s. `ClientGame`'s record of the
 * state of the game comes completely from `ServerGame`. It does
 * not do any book-keeping. Ie. It has no concept of `Player`
 * objects other than the
 * 
 * @extends Grid
 */
abstract class Game extends Grid {

    protected lang: Lang;

    public constructor(height: number, width: number) {
        super(height, width);

        // TODO: set default language:
        this.lang = null;
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
     * @param tile The `Tile` to shuffle their `LangChar`-`LangSeq` pair for.
     */
    protected shuffleLangCharSeqAt(tile: Tile): void {
        const charSeqPair: LangCharSeqPair = this.lang.getNonConflictingChar(
            this.getUNT(tile.pos).map(t => t.langSeq)
        );
        tile.setLangCharSeq(charSeqPair);
    }

    /**
     * Call for a `HumanPlayer` whose `seqBuffer` should be that of the
     * `Tile` provided as `dest`. Reject the request if `dest` is occupied.
     * 
     * @param player 
     * @param dest 
     */
    protected processMoveRequest(player: Player, dest: Tile): void {
        if (dest.isOccupied()) {
            // Only one `Player` can occupy a `Tile` at a time.
            return;
        }
        if (player instanceof HumanPlayer) {
            if (player.seqBuffer === dest.langSeq) {
                // TODO
            }
        } else if (player instanceof ArtificialPlayer) {
            ;
        } else {
            throw new TypeError("Unexpected argument type for 'player' argument.");
        }
    }

    /**
     * Update the `grid`. Call either at the end of `::processMoveRequest`
     * if I am a `ServerGame` or `OfflineGame`. It is essential that for
     * these implementations, this method is not scheduled for later since
     * it is the 'write' stage of that critical operation. Otherwise, if
     * I am a `ClientGame`, bind this as the callback function of an event
     * notification from the server.
     * 
     * @param desc A descriptor for the player-movement event.
     */
    protected abstract processPlayerMovement(desc: PlayerMovementEvent): void;

}





/**
 * 
 */
class PlayerMovementEvent {

    private constructor(
        public readonly playerId: number,
        public readonly destPosX: number,
        public readonly destPosY: number,
        public readonly newLangChar: LangChar,
        public readonly newLangSeq:  LangSeq,
    ) {
        Object.freeze(this);
    }

}
