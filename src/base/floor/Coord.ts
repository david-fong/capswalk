import { Euclid2 } from "floor/impl/Euclid";
import { Beehive } from "floor/impl/Beehive";


/**
 * A position in 2-dimensional space. Values may be non-integer values.
 * 
 * Immutable. All `Pos` objects returned by operations are new objects.
 * 
 * Norm accessors measure distance from the origin (0, 0).
 * 
 * @param B - The shape of a bare instance. Change to `extends Impl` if
 *      needed.
 */
export abstract class Coord<B extends Coord.Bare.Impl> {

    /**
     * **Important:** Implementations should not define a constructor.
     * 
     * Freezes `this`.
     * 
     * @param desc -
     */
    protected constructor(desc: B) {
        Object.assign(this, desc);
        Object.freeze(this);
    }

    /**
     * @returns
     * By default, this returns a completely plain object containing
     * all instance fields found in an upward prototype traversal of
     * the `this` object.
     */
    public getBareBones(): B {
        return Object.assign(Object.create(null), this);
    }



    public abstract equals(other: B): boolean;

    /**
     * For discrete-coordinate-based systems, this is used to round
     * non-discrete coordinates to discrete ones.
     */
    public abstract round(): Coord<B>;



    /**
     * Also known as the "manhattan norm".
     * 
     * @param other - The norm is taken relative to `other`.
     * @returns The sum of the absolute values of each coordinate.
     */
    public oneNorm(other: B): number {
        return this.sub(other).originOneNorm();
    }
    public abstract originOneNorm(): number;

    /**
     * Diagonal distance in 2D / hypotenuse.
     * 
     * @param other - The norm is taken relative to `other`.
     * @returns The square root of the square of each coordinate.
     */
    public twoNorm(other: B): number {
        return this.sub(other).originalTwoNorm();
    }
    public abstract originalTwoNorm(): number;

    /**
     * @param other - The norm is taken relative to `other`.
     * @returns The length of the longest dimension.
     */
    public infNorm(other: B): number {
        return this.sub(other).originalInfNorm();
    }
    public abstract originalInfNorm(): number;

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
     * 
     * @param other - The alignment is taken relative to `other`.
     */
    public axialAlignment(other: B): number {
        return this.sub(other).originalAxialAlignment();
    }
    public abstract originalAxialAlignment(): number;



    public abstract add(other: B): Coord<B>;

    public abstract sub(other: B): Coord<B>;

    public abstract mul(scalar: number): Coord<B>;



    /**
     * @returns A `Pos` with random, integer valued `x` and `y` coordinates
     * within the specified upper limits and within the first quadrant.
     * 
     * @param boundX An exclusive bound on x-coordinate.
     * @param boundY An exclusive bound on y-coordinate. Optional. Defaults to `boundX`.
     */
    // TODO:
    // public static randomQ1(boundX: number, boundY: number = boundX): Coord {
    //     return new Coord(
    //         Math.round(boundX * Math.random()),
    //         Math.round(boundY * Math.random()),
    //     );
    // }

}



export namespace Coord {
    export namespace Bare {
        export type Impl
            = Euclid2.Coord.Bare
            | Beehive.Coord.Bare;
    }
}
