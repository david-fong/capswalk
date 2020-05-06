import type { Coord, Tile } from "floor/Tile";
import { Grid } from "floor/Grid";
import { OmHooks } from 'defs/OmHooks';


/**
 * All implementations must call `Grid.__VisibleGrid_super` at the end
 * of their constructors.
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
export interface VisibleGrid<S extends Coord.System>
extends Grid<S>, VisibleGridMixin<S> { }

export namespace VisibleGrid {

    export interface ClassIf<S extends Coord.System> extends Grid.ClassIf<S> {
        /**
         * @override
         */
        new(desc: Grid.CtorArgs<S>): VisibleGrid<S>;
    };

    // Each implementation must register itself into this dictionary.
    export declare const __Constructors: {
        readonly [ S in Coord.System ]: Grid.ClassIf<S>
    };

    export const getImplementation = <S extends Coord.System>(coordSys: S): ClassIf<S> => {
        const ctor = __Constructors[coordSys];
        return ctor as unknown as ClassIf<S>;
    };
}


/**
 *
 */
export class VisibleGridMixin<S extends Coord.System> {
    /**
     * Contains the implementation-dependant HTML representation of
     * the grid.
     */
    public readonly baseElem: HTMLElement;
    public readonly spotlightElems: TU.RoArr<HTMLElement>;

    /**
     * Note: I would rather have this implementation go under the
     * `VisibleGrid` class, but I don't want to get into mixins as of
     * now to get around no-multiple-inheritance.
     *
     * @param desc -
     * @param gridImplElem -
     */
    public __VisibleGrid_super(desc: Grid.CtorArgs<S>, gridImplElem: HTMLElement): void {
        const OHG = OmHooks.Grid;
        gridImplElem.classList.add(OHG.Class.IMPL_BODY);
        gridImplElem.dataset[OHG.Dataset.IMPL_COORD_SYS] = desc.coordSys;
        (this.baseElem as HTMLElement) = gridImplElem;

        // Initialize spotlight elements:
        const sslElem = document.createElement("div");
        sslElem.classList.add(OmHooks.Player.Class.SHORT_SPOTLIGHT);
        const lslElem = document.createElement("div");
        lslElem.classList.add(OmHooks.Player.Class.LONG_SPOTLIGHT);
        (this.spotlightElems as TU.RoArr<HTMLElement>) = Object.freeze([ sslElem, lslElem, ]);
    }
}
Object.freeze(VisibleGridMixin);
Object.freeze(VisibleGridMixin.prototype);
