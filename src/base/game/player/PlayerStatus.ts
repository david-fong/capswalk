

/**
 * This abstracts acts of modification upon a player's state, allowing
 * extension classes to override setters to perform additional tasks
 * such as visually rendering updates to this state information in a
 * web browser, and playing sound effects.
 */
export class PlayerStatus {

    #score: number;
    #rawHealth: number;

    public reset(): void {
        this.score = 0;
        this.rawHealth  = 0;
    }


    public get score(): number {
        return this.#score;
    }
    public set score(newValue: number) {
        this.#score = newValue;
    }

    public get rawHealth(): number {
        return this.#rawHealth;
    }
    public set rawHealth(newRawHealth: number) {
        this.#rawHealth = newRawHealth;
    }
    // TODO.design Equation and architecture for getting/setting adjusted health.

    public get isDowned(): boolean {
        return this.rawHealth < 0.0;
    }

}
