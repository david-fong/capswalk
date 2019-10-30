
/**
 * norm accessors measure distance from the origin (0, 0).
 */
class Pos {
    readonly x: number;
    readonly y: number;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    public round(): Pos {
        return new Pos(Math.round(this.x), Math.round(this.y));
    }

    /**
     * also known as the "manhattan norm".
     */
    public get oneNorm(): number {
        return Math.abs(this.x) + Math.abs(this.y);
    }

    /**
     * diagonal distance in 2D / hypotenuse.
     */
    public get twoNorm(): number {
        return Math.sqrt((this.x ** 2) + (this.y **2));
    }

    /**
     * length of the longest dimension.
     */
    public get infNorm(): number {
        return Math.max(Math.abs(this.x), Math.abs(this.y));
    }



    public add(other: Pos): Pos {
        return new Pos(this.x + other.x, this.y + other.y);
    }

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
        )
    }



    /**
     * creates a [Pos] with random, integer valued [x] and [y] coordinates
     * within the specified upper limits and within the first quadrant.
     * 
     * @param boundX exclusive bound on x-coordinate.
     * @param boundY exclusive bound on y-coordinate. optional. defaults to [boundX].
     */
    public static randomQ1(boundX: number, boundY: number = boundX): Pos {
        return new Pos(
            Math.round(boundX * Math.random()),
            Math.round(boundY * Math.random()),
        );
    }
}
