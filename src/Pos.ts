
export type BarePos = {
    readonly x: number;
    readonly y: number;
};


/**
 * A position in 2-dimensional space. Values may be non-integer values.
 * 
 * Immutable. All `Pos` objects returned by operations are new objects.
 * 
 * Norm accessors measure distance from the origin (0, 0).
 */
export class Pos implements BarePos {

    public static readonly ORIGIN: Pos = new Pos(0, 0);

    public readonly x: number;
    public readonly y: number;

    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        Object.freeze(this);
    }

    public asBarePos(): BarePos {
        return {
            x: this.x,
            y: this.y,
        };
    }

    public static ofBarePos(pos: BarePos): Pos {
        return new Pos(pos.x, pos.y);
    }



    public equals(other: BarePos): boolean {
        return this.x === other.x && this.y === other.y;
    }

    public round(): Pos {
        return new Pos(Math.round(this.x), Math.round(this.y));
    }

    public toString(): string {
        return `(${this.x},${this.y})`;
    }



    /**
     * Also known as the "manhattan norm".
     * 
     * @param other - If included, the norm is taken relative to this.
     * @returns The sum of the absolute values of each coordinate.
     */
    public oneNorm(other?: BarePos): number {
        if (other) {
            return this.sub(other).infNorm();
        } else {
            return Math.abs(this.x) + Math.abs(this.y);
        }
    }

    /**
     * Diagonal distance in 2D / hypotenuse.
     * 
     * @returns The square root of the square of each coordinate.
     */
    public get twoNorm(): number {
        return Math.sqrt((this.x ** 2) + (this.y ** 2));
    }

    /**
     * @param other - If included, the norm is taken relative to this.
     * @returns The length of the longest dimension.
     */
    public infNorm(other?: BarePos): number {
        if (other) {
            return this.sub(other).infNorm();
        } else {
            return Math.max(Math.abs(this.x), Math.abs(this.y));
        }
    }

    /**
     * @returns A number in the range (0, 1). `One` means the x and y
     *      coordinates align to the x or y axis, and `Zero` means they
     *      are plus or minus 45 degrees from the x or y axis.
     * 
     * You can try this yourself in [Desmos](https://www.desmos.com/calculator)
     * by pasting in the below code segment and adding a slider for `a`
     * for continuous values between zero and one.
     * 
     * ```latex
     * \frac{\left|\left|x\right|-\left|y\right|\right|}{\left|x\right|+\left|y\right|}=a
     * ```
     */
    public get axialAlignment(): number {
        return Math.abs(Math.abs(this.x) - Math.abs(this.y))
            / (Math.abs(this.x) + Math.abs(this.y));
    }



    public add(other: BarePos): Pos {
        return new Pos(this.x + other.x, this.y + other.y);
    }

    /**
     * @param other - 
     * @returns The subtraction of `other` from `this`.
     */
    public sub(other: BarePos): Pos {
        return new Pos(this.x - other.x, this.y - other.y);
    }

    public mul(scalar: number): Pos {
        return new Pos(scalar * this.x, scalar * this.y);
    }

    public mulRound(scalar: number): Pos {
        return new Pos(
            Math.round(scalar * this.x),
            Math.round(scalar * this.y),
        );
    }



    /**
     * @returns A `Pos` with random, integer valued `x` and `y` coordinates
     * within the specified upper limits and within the first quadrant.
     * 
     * @param boundX An exclusive bound on x-coordinate.
     * @param boundY An exclusive bound on y-coordinate. Optional. Defaults to `boundX`.
     */
    public static randomQ1(boundX: number, boundY: number = boundX): Pos {
        return new Pos(
            Math.round(boundX * Math.random()),
            Math.round(boundY * Math.random()),
        );
    }

}
