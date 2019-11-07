
/**
 * A position in 2-dimensional space. Values may be non-integer values.
 * 
 * Immutable. All `Pos` objects returned by operations are new objects.
 * 
 * Norm accessors measure distance from the origin (0, 0).
 */
export class Pos {

    public static readonly ORIGIN: Pos = new Pos(0, 0);

    public readonly x: number;
    public readonly y: number;

    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }



    public equals(other: Pos): boolean {
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
     */
    public get oneNorm(): number {
        return Math.abs(this.x) + Math.abs(this.y);
    }

    /**
     * Diagonal distance in 2D / hypotenuse.
     */
    public get twoNorm(): number {
        return Math.sqrt((this.x ** 2) + (this.y **2));
    }

    /**
     * Length of the longest dimension.
     */
    public get infNorm(): number {
        return Math.max(Math.abs(this.x), Math.abs(this.y));
    }



    public add(other: Pos): Pos {
        return new Pos(this.x + other.x, this.y + other.y);
    }

    /**
     * subtract `other` from `this`.
     */
    public sub(other: Pos): Pos {
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
