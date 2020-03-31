

/**
 * This abstracts acts of modification upon a player's state, allowing
 * extension classes to override setters to perform additional tasks
 * such as visually rendering updates to this state information in a
 * web browser, and playing sound effects.
 */
export class PlayerStatus {

    #score: number;
    #unadjustedStockpile: number;

    public reset(): void {
        this.score      = 0;
        this.unadjustedStockpile  = 0;
    }


    public get score(): number {
        return this.#score;
    }
    public set score(newValue: number) {
        this.#score = newValue;
    }

    public get unadjustedStockpile(): number {
        return this.#unadjustedStockpile;
    }
    public set unadjustedStockpile(stockpile: number) {
        this.#unadjustedStockpile = stockpile;
    }

    public get isDowned(): boolean {
        return this.unadjustedStockpile < 0.0;
    }

}
