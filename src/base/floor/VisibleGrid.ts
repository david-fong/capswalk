import { Coord } from "floor/Coord";
import type { Grid } from "floor/Grid";


/**
 *
 *
 * NOTE: As a design choice, this is put in a separate file from the
 * base `Grid` class with a _separate_ dictionary of implementation
 * literals so that the build tooling can infer that this code can
 * be excluded (tree shaking). The implementations may still go in
 * the same file as their non-visible implementation since they are
 * separate exports (this can be tree-shaken). Specifically, the
 * _server_ related code will benefit from this choice since it will
 * not use
 */
export interface VisibleGrid<S extends Coord.System> extends Grid<S> {

    // TODO.design is there any common code / interfacing I should put here?
}


export namespace VisibleGrid {

    export interface ClassIf<S extends Coord.System> extends Grid.ClassIf<S> {
        /**
         * @override
         */
        new(desc: Grid.CtorArgs<S>): VisibleGrid<S>;
    };

    // Each implementation must register itself into this dictionary.
    export const __Constructors = {} as Readonly<{
        [S in Coord.System]: ClassIf<S>;
    }>;

    export const getImplementation = <S extends Coord.System>(coordSys: S): ClassIf<S> => {
        const ctor = __Constructors[coordSys];
        return ctor as ClassIf<S>;
    };

}