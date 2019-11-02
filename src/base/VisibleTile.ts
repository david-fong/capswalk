
/**
 * 
 * Layers:
 * 0. Invisible cell layer (opaque on visual bell)
 * 1. Empty layer for spotlight mask
 * 2. Player face layer
 * 3. 
 * 
 * @extends Tile
 */
class VisibleTile extends Tile {

    readonly playerDivElem:   HTMLDivElement;
    readonly langCharDivElem: HTMLDivElement;
    readonly langSeqDivElem:  HTMLDivElement;

    /**
     * @override
     */
    public visualBell(): void {
        ; // TODO
    }

    public setLangCharSeq(char: LangChar, seq: LangSeq): void {
        ;
    }

    public get langChar(): LangChar {
        // TODO: is it correct to use innterHTML instead of innerText?
        return this.langCharDivElem.innerHTML;
    }

    public get langSeq(): LangSeq {
        return this.langSeqDivElem.innerHTML;
    }

}
