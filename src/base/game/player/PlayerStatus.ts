

/**
 * This abstracts acts of modification upon a player's state, allowing
 * extension classes to override setters to perform additional tasks
 * such as visually rendering updates to this state information in a
 * web browser, and playing sound effects.
 */
class PlayerStatus {

    #score:       number;
    #stockpile:   number;
    #isDowned:    boolean;
    #isFrozen:    boolean;
    #isBubbling:  boolean;
    #percentBubbleCharge: number;

    public reset(): void {
        this.score      = 0;
        this.stockpile  = 0;
        this.isDowned   = false;
        this.isFrozen   = false;
        this.isBubbling = false;
        this.percentBubbleCharge = 0;
    }


    public get score(): number {
        return this.#score;
    }
    public set score(newValue: number) {
        this.#score = newValue;
    }

    public get stockpile(): number {
        return this.#stockpile;
    }
    public set stockpile(stockpile: number) {
        this.#stockpile = stockpile;
    }


    public get isDowned(): boolean {
        return this.#isDowned;
    }
    public set isDowned(isDowned: boolean) {
        this.#isDowned = isDowned;
    }

    public get isFrozen(): boolean {
        return this.#isFrozen;
    }
    public set isFrozen(isFrozen: boolean) {
        this.#isFrozen = isFrozen;
    }

    public get isBubbling(): boolean {
        return this.#isBubbling;
    }
    public set isBubbling(isBubbling: boolean) {
        this.#isBubbling = isBubbling;
    }

    public get percentBubbleCharge(): number {
        return this.#percentBubbleCharge;
    }
    public set percentBubbleCharge(bubbleCharge: number) {
        this.#percentBubbleCharge = bubbleCharge;
    }

}
