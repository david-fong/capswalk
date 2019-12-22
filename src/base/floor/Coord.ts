import { Euclid2 } from "floor/impl/Euclid2";
import { Beehive } from "floor/impl/Beehive";


/**
 * Immutable. All `Coord` objects returned by operations are new objects.
 * 
 * @template S - An enum identifying the unique implementation class.
 */
export abstract class Coord<S extends Coord.System> {

    /**
     * This does nothing. Subclass constructors should copy in the
     * fields specified by `desc` and end with a self-freezing call.
     * 
     * @param desc - Untouched. Here as a reminder of what is needed.
     */
    protected constructor(desc: Coord.Ish<S>) {}

    /**
     * @returns
     * By default, this returns a completely plain object containing
     * all instance fields found in an upward prototype traversal of
     * the `this` object.
     */
    public getBareView(): Coord.Bare<S> {
        return Object.freeze(Object.assign(Object.create(null), this));
    }



    public abstract equals(other: Coord.Ish<S>): boolean;

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
    public oneNorm(other: Coord.Ish<S>): number {
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
    public infNorm(other: Coord.Ish<S>): number {
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
    public axialAlignment(other: Coord.Ish<S>): number {
        return this.sub(other).originAxialAlignment();
    }
    public abstract originAxialAlignment(): number;



    public abstract add(other: Coord.Ish<S>): Coord<S>;

    public abstract sub(other: Coord.Ish<S>): Coord<S>;

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

    export type Bare<S extends System>
        = S extends System.EUCLID2 ? Euclid2.Coord.Bare
        : S extends System.BEEHIVE ? Beehive.Coord.Bare
        : never;

    const Constructors = Object.freeze(<const>{
        [ System.EUCLID2 ]: Euclid2.Coord,
        [ System.BEEHIVE ]: Beehive.Coord,
    }) as Readonly<Record<System, typeof Coord>>;

    // Note: The below exports do not require any modificaions with
    // the additions of new coordinate systems.

    /**
     * @returns
     * A coordinate of the specified system according to the given
     * arguments. The mapping in `Constructors` is not statically
     * checked here because I can't get that to work, so just make
     * sure to sanity check that it works at runtime.
     * 
     * @param coordSys -
     * @param desc -
     */
    export const of = <S extends System>(coordSys: S, desc: Ish<S>): Coord<S> => {
        return new (Constructors[coordSys] as any)(desc);
    };

    /**
     * Use this to specify the type for function arguments that are
     * able to take a bare coordinate, but will also take a non-bare
     * input from the same coordinate system.
     * 
     * Unfortunately, TypeScript will not allow me to say that Coord
     * extends the bare coordinate type of its own coordinate system
     * by using the generic `Bare<S>` syntax. 
     */
    export type Ish<S extends System> = Bare<S> | Coord<S>;
}
