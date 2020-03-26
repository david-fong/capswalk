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
 * the same file as their non-visible implementation, since they are
 * separate exports (this can be tree-shaken).
 */
export abstract class VisibleGrid<S extends Coord.System> extends Grid<S> {

    public constructor(desc: Grid.CtorArgs<S>) {
        super(desc);
    }

}



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
        // Note: For some reason TypeScript can't figure out the type here.
        return ((Constructors[coordSys]) as unknown as ClassIf<S>);
    };

}