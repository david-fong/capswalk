import { Player } from "utils/TypeDefs";

import { Euclid2 } from "./impl/Euclid2";
import { Beehive } from "./impl/Beehive";
import { __Bench } from "floor/impl/__Bench";


/**
 * Done manually so that grid implementations can use their coordinate
 * implementation's non-standard methods safely on coordinates retrieved
 * from Grid tiles.
 */
export type Coord<S extends Coord.System> = Coord.Bare<S> &
      S extends Coord.System.__BENCH ? __Bench.Coord
    : S extends Coord.System.EUCLID2 ? Euclid2.Coord
    : S extends Coord.System.BEEHIVE ? Beehive.Coord
    : never;

/**
 * 
 */
export namespace Coord {

    export const enum System {
        __BENCH = "__BENCH",
        EUCLID2 = "EUCLID2",
        BEEHIVE = "BEEHIVE",
    }

    export type Bare<S extends System>
        = S extends System.__BENCH ? __Bench.Coord.Bare
        : S extends System.EUCLID2 ? Euclid2.Coord.Bare
        : S extends System.BEEHIVE ? Beehive.Coord.Bare
        : never;

    // ==============================================================
    // Note: The below exports do not require any modificaions with
    // the additions of new coordinate systems.
    // ==============================================================

    export namespace System {
        export type GridCapable = Exclude<Coord.System, Coord.System.__BENCH>;
    }

    /**
     * @param coord -
     */
    export function assertNotBench<S extends Coord.System.GridCapable>(
        coord: Coord<S | Coord.System.__BENCH>): asserts coord is Coord<S> {
        if ((coord as Coord.Bare<Coord.System.__BENCH>).playerId !== undefined) {
            throw new TypeError("Failed assertion: coord must not be from the bench system.");
        }
    }



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
            desc; // Prevents warning about unused parameter.
        }

        public abstract equals(other: Coord.Bare<S>): boolean;

    }

    export namespace Abstract {
        export abstract class Mathy<S extends Coord.System.GridCapable> extends Coord.Abstract<S> {
            /**
             * For discrete-coordinate-based systems, this is used to round
             * non-discrete coordinates to discrete ones.
             */
            public abstract round(): Coord<S>;

            public abstract add(other: Coord.Bare<S>): Coord<S>;
            public abstract sub(other: Coord.Bare<S>): Coord<S>;
            public abstract mul(scalar: number): Coord<S>;
        }
    }

}
