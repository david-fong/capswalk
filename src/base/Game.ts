
/**
 * 
 * 
 * This class performs the majority of management over [Tile] and
 * [Player] objects.
 */
abstract class Game {
    
    /**
     * Get Unoccupied Neghbouring Tiles within one length of [pos]
     * according to [Pos::infNorm]. Tiles for which [::isOccupied]
     * is true are filtered out of the returned array.
     * 
     * @param pos 
     */
    public getUNT(pos: Pos): Array<Tile> {
        return new Array(); // TODO
    }


    processHumanMoveRequest(player: Player, matchedSeq: LangSeq): void {
        ;
    }

}
