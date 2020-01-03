import { Euclid2 } from "./impl/Euclid2";
import { Beehive } from "./impl/Beehive";


/**
 * 
 */
export type Coord<S extends Coord.System> = Coord.Bare<S> & Coord.Abstract<S>;

/**
 * 
 */
export namespace Coord {

    /**
     * The coordinate-system-agnostic identifier for any player's
     * bench tile.
     */
    export const BENCH = <const>"BENCH_COORD";

    // ==============================================================

    export const enum System {
        EUCLID2 = "EUCLID2",
        BEEHIVE = "BEEHIVE",
    }

    export type Bare<S extends System>
        = S extends System.EUCLID2 ? Euclid2.Coord.Bare
        : S extends System.BEEHIVE ? Beehive.Coord.Bare
        : never;

    // NOTE: we no longer have an absolute need for this. Grid
    // implementations are responsible to use their own Coord
    // constructors. It may have use for testing purposes, though.
    // if so, please redefine the factory / producer `Coord.of`.
    const Constructors = Object.freeze(<const>{
        [ System.EUCLID2 ]: Euclid2.Coord,
        [ System.BEEHIVE ]: Beehive.Coord,
    });
    /**
     * Will err if:
     * - the coordinate systems between mappings don't match.
     * - the extension's constructor signature is not compatible
     *   with that of the generic abstract base class.
     * - the extension is not type compatible as its `Bare` type.
     */
    const __ctorMapTypeAssertion__ = (): void => {
        Constructors as Readonly<{
            [S in System]: {new(desc: Coord.Bare<S>): Coord<S>}
        }>;
    };

    // ==============================================================
    // Note: The below exports do not require any modificaions with
    // the additions of new coordinate systems.
    // ==============================================================

    /**
     * Immutable. All `Coord` objects returned by operations are new objects.
     * 
     * @template S - An enum identifying the unique implementation class.
     */
    export abstract class Abstract<S extends Coord.System> {

        /**
         * This does nothing. Subclass constructors should copy in the
         * fields specified by `desc` and end with a self-freezing call.
         * 
         * @param desc - Untouched. Here as a reminder of what is needed.
         */
        protected constructor(desc: Coord.Bare<S>) {
            desc; // prevent warning about unused parameter.
        }



        public abstract equals(other: Coord.Bare<S>): boolean;

        /**
         * For discrete-coordinate-based systems, this is used to round
         * non-discrete coordinates to discrete ones.
         */
        public abstract round(): Coord<S>;



        /**
         * Also known as the "manhattan norm".
         * 
         * _Do not override this._
         * 
         * @param other - The norm is taken relative to `other`.
         * @returns The sum of the absolute values of each coordinate.
         */
        // TODO: document: what is this used for?
        public oneNorm(other: Coord.Bare<S>): number {
            return this.sub(other).originOneNorm();
        }
        public abstract originOneNorm(): number;

        /**
         * 
         * _Do not override this._
         * 
         * @param other - The norm is taken relative to `other`.
         * @returns The length of the longest dimension.
         */
        // TODO: document: what is this used for?
        public infNorm(other: Coord.Bare<S>): number {
            return this.sub(other).originInfNorm();
        }
        public abstract originInfNorm(): number;

        /**
         * @returns
         * A number in the range (0, 1). `One` means the x and y coordinates
         * align to the x or y axis, and `Zero` means they are plus or minus
         * 45 degrees from the x or y axis.
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
        public axialAlignment(other: Coord.Bare<S>): number {
            return this.sub(other).originAxialAlignment();
        }
        public abstract originAxialAlignment(): number;



        public abstract add(other: Coord.Bare<S>): Coord<S>;

        public abstract sub(other: Coord.Bare<S>): Coord<S>;

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

}
