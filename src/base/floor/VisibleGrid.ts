import CSS from "./grid.m.css";
import PLAYER_CSS from "game/player/player.m.css";
// import "./zindex.m.css"; // not used. file only contains documentation.
import { OmHooks } from "defs/OmHooks";
import { JsUtils } from "defs/JsUtils";

import type { Coord, Tile } from "floor/Tile";
import { VisibleTile } from "floor/VisibleTile";
import type { Grid } from "floor/Grid";

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
        if (desc.tileClass !== VisibleTile) {
            throw new TypeError("never");
        }
        const OHG = OmHooks.Grid;
        gridImpl.setAttribute("role", "presentation");
        gridImpl.classList.add(...CSS["impl-body"].split(" "));
        gridImpl.dataset[OHG.Dataset.IMPL_COORD_SYS] = desc.coordSys;
        gridImpl.translate  = false; // https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/translate
        gridImpl.spellcheck = false; // typically assumed by the UA, but it doesn't hurt to say explicitly.
        // @ts-expect-error : RO=
        this.baseElem = gridImpl;

        // Initialize spotlight elements:
        const shortSpotlight = JsUtils.mkEl("div", [PLAYER_CSS["spotlight-short"]]);
        const longSpotlight  = JsUtils.mkEl("div", [PLAYER_CSS["spotlight-long"]]);
        // @ts-expect-error : RO=
        this.spotlightElems = Object.freeze([ shortSpotlight, longSpotlight ]);
    }
}
export interface VisibleGridMixin<S extends Coord.System> {};
Object.freeze(VisibleGridMixin);
Object.freeze(VisibleGridMixin.prototype);