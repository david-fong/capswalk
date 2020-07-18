import type { Coord, Tile } from "floor/Tile";
import { Grid } from "floor/Grid";
import { OmHooks } from 'defs/OmHooks';


/**
 * All implementations must call `Grid._superVisibleGrid` at the end
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
    export declare const _Constructors: {
        readonly [ S in Coord.System ]: Grid.ClassIf<S>
    };

    export const getImplementation = <S extends Coord.System>(coordSys: S): ClassIf<S> => {
        const ctor = _Constructors[coordSys];
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
    declare public readonly baseElem: HTMLElement;
    declare public readonly spotlightElems: TU.RoArr<HTMLElement>;

    /**
     * Note: I would rather have this implementation go under the
     * `VisibleGrid` class, but I don't want to get into mixins as of
     * now to get around no-multiple-inheritance.
     *
     * @param desc -
     * @param gridImpl -
     */
    public _superVisibleGrid(desc: Grid.CtorArgs<S>, gridImpl: HTMLElement): void {
        const OHG = OmHooks.Grid;
        gridImpl.setAttribute("role", "presentation");
        gridImpl.classList.add(OHG.Class.IMPL_BODY);
        gridImpl.dataset[OHG.Dataset.IMPL_COORD_SYS] = desc.coordSys;
        (this.baseElem as HTMLElement) = gridImpl;

        // Initialize spotlight elements:
        const shortSpotlight = document.createElement("div");
        shortSpotlight.classList.add(OmHooks.Player.Class.SHORT_SPOTLIGHT);
        const longSpotlight = document.createElement("div");
        longSpotlight.classList.add(OmHooks.Player.Class.LONG_SPOTLIGHT);
        (this.spotlightElems as TU.RoArr<HTMLElement>) = Object.freeze([ shortSpotlight, longSpotlight, ]);
    }
}
export interface VisibleGridMixin<S extends Coord.System> {};
Object.freeze(VisibleGridMixin);
Object.freeze(VisibleGridMixin.prototype);
