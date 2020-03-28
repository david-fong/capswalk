

/**
 * This abstracts acts of modification upon a player's state, allowing
 * extension classes to override setters to perform additional tasks
 * such as visually rendering updates to this state information in a
 * web browser, and playing sound effects.
 */
class PlayerStatus {

    private _score:       number;
    private _stockpile:   number;
    private _isDowned:    boolean;
    private _isFrozen:    boolean;
    private _isBubbling:  boolean;
    private _percentBubbleCharge: number;

    public reset(): void {
        this.score      = 0;
        this.stockpile  = 0;
        this.isDowned   = false;
        this.isFrozen   = false;
        this.isBubbling = false;
        this.percentBubbleCharge = 0;
    }


    public get score(): number {
        return this._score;
    }
    public set score(newValue: number) {
        this._score = newValue;
    }

    public get stockpile(): number {
        return this._stockpile;
    }
    public set stockpile(stockpile: number) {
        this._stockpile = stockpile;
    }


    public get isDowned(): boolean {
        return this._isDowned;
    }
    public set isDowned(isDowned: boolean) {
        this._isDowned = isDowned;
    }

    public get isFrozen(): boolean {
        return this._isFrozen;
    }
    public set isFrozen(isFrozen: boolean) {
        this._isFrozen = isFrozen;
    }

    public get isBubbling(): boolean {
        return this._isBubbling;
    }
    public set isBubbling(isBubbling: boolean) {
        this._isBubbling = isBubbling;
    }

    public get percentBubbleCharge(): number {
        return this._percentBubbleCharge;
    }
    public set percentBubbleCharge(bubbleCharge: number) {
        this._percentBubbleCharge = bubbleCharge;
    }

}
