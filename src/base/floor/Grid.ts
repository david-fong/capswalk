import { OmHooks } from "defs/OmHooks";
import { Coord, Tile } from "./Tile";
import { TileGetter } from "./TileGetter";

import type { Euclid2 } from "./impl/Euclid2";
import type { Beehive } from "./impl/Beehive";
import { VisibleGrid } from "floor/VisibleGrid";


/**
 * # 🗺 The Grid Class
 *
 * A Collection of Tiles.
 */
export abstract class Grid<S extends Coord.System> implements TileGetter.Source<S> {

    // A type-annotated alias to this.constructor.
    public readonly static: Grid.ClassIf<S>;

    public readonly dimensions: Grid.Dimensions<S>;

    public get area(): number {
        return this.static.getArea(this.dimensions);
    }

    public readonly tile: TileGetter<S,[Coord.Bare<S>]>;


    /**
     * Protected. See `Grid.getImplementation` for how to access class
     * literals for construction.
     *
     * _Does not call reset._
     *
     * @param desc -
     */
    protected constructor(desc: Grid.CtorArgs<S>) {
        this.static = desc.gridClass;
        this.dimensions = desc.dimensions;
        this.tile = new TileGetter(this);
    }

    /**
     * Calls {@link Tile#reset} for each {@link Tile} in this `Grid`.
     */
    public reset(): void {
        this.forEachTile((tile) => tile.reset());
    }

    /**
     * Performs simple checks that the grid is playable.
     *
     * - Each tile in the grid has a non-self destination (coord#equals).
     * - (compute-heavyish): Each tile follows Impl.getAmbiguityThreshold
     */
    protected check(): void {
        // Check that
    }


    /**
     * For BaseGame's implementation of SER/DES to work, the traversal
     * order taken by an implementation of this method must depend
     * only on the dimensions of the instance. Ie. If two Grids (such
     * as those at the Client and Server when separated by a network)
     * were constructed with the same arguments for their dimensions,
     * then their Tiles should be traversed in the same order by this
     * function.
     *
     * @param consumer -
     * @param thisArg -
     */
    public abstract forEachTile(consumer: (tile: Tile<S>) => void, thisArg?: object): void;

    /**
     * @returns
     * One of the closest unoccupied neighbouring tiles toward the
     * direction of `intendedDest`. When possible, ties are encouraged
     * to be broken in such a way that imitates movement in a straight
     * path (visually speaking).
     *
     * **Important:** If All destinations from sourceCoord are occupied
     * (which includes `sourceCoord` itself), the implementation must
     * return `sourceCoord`.
     *
     * @param sourceCoord
     * The coordinate from which to find the next hop.
     *
     * @param intendedDest
     * Does not need to be within the boundaries of the {@link Game}'s
     * grid, or have integer-valued coordinate values.
     */
    public abstract getUntToward(sourceCoord: Coord<S>, intendedDest: Coord<S>): Tile<S>;

    /**
     *
     * @param sourceCoord -
     * @param avoidCoord -
     */
    // TODO.doc
    public abstract getUntAwayFrom(sourceCoord: Coord<S>, avoidCoord: Coord<S>): Tile<S>;

    public getRandomCoord(): Coord<S> {
        return this.static.getRandomCoord(this.dimensions);
    }

    /**
     * A coord that is at most `radius` movements away from `origin`.
     * The returned value does not necessarily need to be within this
     * grid's dimensions as long as the returned coordinate can be
     * meaningfully truncated by `getUntToward` when passing `origin`
     * as the `sourceCoord` argument.
     *
     * The returned value should follow a uniform distribution.
     */
    public abstract getRandomCoordAround(origin: Coord.Bare<S>, radius: number): Coord<S>;


    /**
     * @override
     */
    public abstract __getTileAt(coord: Coord.Bare<S>): Tile<S>;

    /**
     * @override
     */
    public abstract __getTileDestsFrom(coord: Coord.Bare<S>): Array<Tile<S>>;

    /**
     * @override
     */
    public abstract __getTileSourcesTo(coord: Coord.Bare<S>): Array<Tile<S>>;

    /**
     * The returned value must be consistent with results from the
     * methods `__getTileDestsFrom` and `__getTileSourcesTo`.
     *
     * @param source -
     * @param dest -
     */
    public abstract minMovesFromTo(source: Coord.Bare<S>, dest: Coord.Bare<S>): number;

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
        gridImplElem.tabIndex = 0;
        gridImplElem.classList.add(OHG.Class.IMPL_BODY);
        const parentElem = document.getElementById(desc.domParentHtmlIdHook);
        if (!parentElem) {
            throw new RangeError(`The ID \"${desc.domParentHtmlIdHook}\"`
            + ` did not refer to an existing html element.`);
        }
        parentElem.dataset[OHG.Dataset.COORD_SYS] = desc.coordSys;
        parentElem.classList.add(
            OHG.Class.GRID,
            OmHooks.General.Class.TEXT_SELECT_DISABLED,
            OmHooks.General.Class.CENTER_CONTENTS,
            OmHooks.General.Class.STACK_CONTENTS,
        );
        // Remove all child elements from host and then append the new grid:
        parentElem.querySelectorAll(`.${OHG.Class.IMPL_BODY}`).forEach((node) => node.remove());
        parentElem.insertAdjacentElement("afterbegin", gridImplElem);
        (this as TU.NoRo<Grid<S>> as TU.NoRo<VisibleGrid<S>>).baseElem = gridImplElem;
        {
            // Add a "keyboard-disconnected" icon if not added already:
            // This needs to be a _later_ sibling of gridImplElem.
            let kbdDcBase: HTMLElement | null = parentElem
                .querySelector(`:scope .${OHG.Class.KBD_DC_BASE}`);
            if (!kbdDcBase) {
                const kbdDcBase = document.createElement("div");
                kbdDcBase.classList.add(
                    OHG.Class.KBD_DC_BASE,
                    OmHooks.General.Class.CENTER_CONTENTS,
                );
                // TODO.impl Add an <svg> with icon instead please.
                {
                    const kbdDcIcon = document.createElement("div");
                    kbdDcIcon.classList.add(OHG.Class.KBD_DC_ICON);
                    kbdDcIcon.innerText = "(click grid to continue typing)";
                    kbdDcBase.appendChild(kbdDcIcon);
                }
                parentElem.appendChild(kbdDcBase);
            }
        }
    }

}
export namespace Grid {

    /**
     * Values do not _need_ to be in range or integers.
     */
    export type Dimensions<S extends Coord.System>
        = S extends Coord.System.EUCLID2 ? Euclid2.Grid.Dimensions
        : S extends Coord.System.BEEHIVE ? Beehive.Grid.Dimensions
        : never;

    // ==============================================================
    // Note: The below exports do not require any modifications with
    // the additions of new coordinate systems.
    // ==============================================================

    export type CtorArgs<S extends Coord.System> = {
        gridClass: Grid.ClassIf<S>;
        tileClass: Tile.ClassIf<S>;
        coordSys: S;
        dimensions: Dimensions<S>;
        domParentHtmlIdHook: string;
    };

    /**
     * Used to simulate abstract static methods.
     */
    export interface ClassIf<S extends Coord.System> {

        /**
         * Constructor
         */
        new(desc: CtorArgs<S>): Grid<S>;

        /**
         * @returns
         * From the caller's point of view, the ambiguity floor is the
         * minimum number of leaf nodes a language must have to be
         * playable with this coordinate system's grid.
         *
         * From the specification's point of view, it is the promised
         * maximum size- for any tile in the grid- of the set of all
         * destinations from sources to itself, excluding itself.
         */
        // TODO.test write a test that checks that this holds for each implementation?
        getAmbiguityThreshold(): number;

        /**
         * @see Grid.DimensionBounds
         */
        getSizeLimits(): Grid.DimensionBounds<S>;

        /**
         * @returns
         * The number of Tiles that could fit in a Grid of such bounds.
         *
         * @param bounds -
         */
        getArea(bounds: Dimensions<S>): number;

        /**
         * @returns
         * A coordinate with random, integer-valued fields within the
         * specified upper limits
         *
         * @param boundX An exclusive bound on x-coordinate.
         * @param boundY An exclusive bound on y-coordinate. Optional. Defaults to `boundX`.
         */
        getRandomCoord(bounds: Dimensions<S>): Coord<S>;

        /**
         * Return values do not need to be the same for repeated calls
         * with identical arguments. None of the returned coordinates
         * should be the same.
         *
         * @param playerCounts -
         */
        getSpawnCoords(
            playerCounts: TU.RoArr<number>,
            dimensions: Dimensions<S>,
        ): TU.RoArr<TU.RoArr<Coord.Bare<S>>>;

    };

    // Each implementation must register itself into this dictionary.
    export declare const __Constructors: {
        readonly [ S in Coord.System ]: Grid.ClassIf<S>
    };

    /**
     * @returns
     * A Grid class for the specified coordinate system.
     *
     * @param coordSys -
     */
    export const getImplementation = <S extends Coord.System>(coordSys: S): ClassIf<S> => {
        // Note: At the time of writing this, separating this into
        // two lines is necessary (otherwise Typescript will feel
        // overwhelmed)
        const ctor = __Constructors[coordSys];
        return ctor as unknown as ClassIf<S>;
    };

    /**
     * Bounds are inclusive. Ie. the specified values are _just_ allowed.
     *
     * Upper and lower bounds must be strictly positive integer values.
     */
    export type DimensionBounds<S extends Coord.System> = Readonly<{
        [ P in keyof Dimensions<S> ]: Readonly<{
            min: number;
            max: number;
        }>;
    }>;

}
// Grid gets frozen in PostInit after __Constructors get initialized.
