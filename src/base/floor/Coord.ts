import { Euclid2 } from "floor/impl/Euclid2";
import { Beehive } from "floor/impl/Beehive";


// helper for brevity trick. needed to break generic circular default.
type CorB<S extends Coord.System, B = typeof Coord.BareImpl[S]> = B | Coord<S>;

/**
 * Immutable. All `Pos` objects returned by operations are new objects.
 * 
 * @param B - The shape of a bare instance. Change to `extends Impl` if
 *      needed.
 * @param C - Use this as the type for "`other`" function arguments-
 *      don't use this for function return-types.
 */
export abstract class Coord<
    S extends Coord.System,
    B extends typeof Coord.BareImpl[S] = typeof Coord.BareImpl[S],
    C extends CorB<S> = CorB<S>
> {

    /**
     * This does nothing. Subclass constructors should copy in the
     * fields specified by `desc` and end with a self-freezing call.
     * 
     * @param desc - Untouched. Here as a reminder of what is needed.
     */
    protected constructor(desc: C) {}

    /**
     * @returns
     * By default, this returns a completely plain object containing
     * all instance fields found in an upward prototype traversal of
     * the `this` object.
     */
    public getBareBones(): B {
        return Object.freeze(Object.assign(Object.create(null), this));
    }



    public abstract equals(other: C): boolean;

    /**
     * For discrete-coordinate-based systems, this is used to round
     * non-discrete coordinates to discrete ones.
     */
    public abstract round(): Coord<S>;



    /**
     * Also known as the "manhattan norm".
     * 
     * TODO: document: what is this used for?
     * 
     * _Do not override this._
     * 
     * @param other - The norm is taken relative to `other`.
     * @returns The sum of the absolute values of each coordinate.
     */
    public oneNorm(other: C): number {
        return this.sub(other).originOneNorm();
    }
    public abstract originOneNorm(): number;

    /**
     * Diagonal distance in 2D / hypotenuse.
     * 
     * TODO: This is not used. please do not use this.
     * 
     * _Do not override this_
     * 
     * @param other - The norm is taken relative to `other`.
     * @returns The square root of the square of each coordinate.
     */
    // public twoNorm(other: C): number {
    //     return this.sub(other).originTwoNorm();
    // }
    // public abstract originTwoNorm(): number;

    /**
     * 
     * TODO: document: what is this used for?
     * 
     * _Do not override this._
     * 
     * @param other - The norm is taken relative to `other`.
     * @returns The length of the longest dimension.
     */
    public infNorm(other: C): number {
        return this.sub(other).originInfNorm();
    }
    public abstract originInfNorm(): number;

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
    public axialAlignment(other: C): number {
        return this.sub(other).originAxialAlignment();
    }
    public abstract originAxialAlignment(): number;



    public abstract add(other: C): Coord<S>;

    public abstract sub(other: C): Coord<S>;

    public abstract mul(scalar: number): Coord<S>;



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
    export const enum System {
        EUCLID2 = "EUCLID2",
        BEEHIVE = "BEEHIVE",
    }
    // Note: not using declaration merging here for "Bare" because
    // the subclasses do that, and cool but contextually undesirable
    // things happen if we try to do the same thing as their parent.
    export type BareType = { [dimension: string]: number, };
    export const BareImpl: Readonly<Record<Coord.System, Coord.BareType>>
    = Object.freeze(<const>{
        [ System.EUCLID2 ]: Euclid2.Coord.Bare,
        [ System.BEEHIVE ]: Beehive.Coord.Bare,
    });
}
