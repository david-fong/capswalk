import { Coord } from "floor/Coord";
import { Grid } from "floor/Grid";

import { Euclid2 } from "./impl/Euclid2";
import { Beehive } from "./impl/Beehive";


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

    // TODO is there any common code / interfacing I can put here?
}

// TODO: make the implementation classes extend their Grids and implement the above interface.
//  make their constructors call super and set up the visual elements.



export namespace VisibleGrid {

    const Constructors = Object.freeze(<const>{
        [ Coord.System.EUCLID2 ]: Euclid2.Grid.Visible,
        [ Coord.System.BEEHIVE ]: Beehive.Grid.Visible,
    }) as Readonly<{
        [S in Coord.System]: ClassIf<S>;
    }>;

    export interface ClassIf<S extends Coord.System> extends Grid.ClassIf<S> {
        /**
         * @override
         */
        new(desc: Grid.CtorArgs<S>): VisibleGrid<S>;
    };

    export const getImplementation = <S extends Coord.System>(coordSys: S): ClassIf<S> => {
        return ((Constructors[coordSys]) as unknown as ClassIf<S>);
    };

}