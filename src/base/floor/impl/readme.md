
# Flooring Implementation Guidelines

For the following guidelines, [`Euclid2`](./Euclid2.ts) can be used as a reference.

If the coordinate system of a new implementation is given some name `<sys_name>`, then a new file must be created in this folder with the name `SysName.ts`. The skeleton code required to integrate the new system into the codebase is as follows:

## Coordinate System

First, a new, unique enum entry for the new coordinate system must be defined in [Coord.System](../Coord.ts). This is the basis of how the rest of the codebase is able to refer to a coordinate system in a generic fashion.

**In `SysName.ts`**

```typescript
import { Coord as BaseCoord } from "../Tile";

// documentation
export namespace SysName {
    type B = Coord.Bare;
    type S = BaseCoord.System.SYSNAME;

    // optional documentation
    export class Coord implements BaseCoord.Abstract<S>, B {
        // field declarations
        public constructor(desc: B) {
            super(desc);
            // field initialization
            Object.freeze(this);
        }
        // abstract method implementations
    }
    export namespace Coord {
        export type Bare = Readonly<{
            // typed field definitions
        }>;
    }
    Object.freeze(Coord);
    Object.freeze(Coord.prototype);
    ...
}
```

**In [`Coord.ts`](../Coord.ts)**

Import your system namespace, and add entries to `Coord` and `Coord.Bare` for the new coordinate system.

## Grid Implementation

**In `SysName.ts`**

```typescript
// coord-related imports
import { JsUtils } from "defs/JsUtils";
import type { Coord as BaseCoord, Tile } from "../Tile";
import type { VisibleTile } from "floor/VisibleTile";
import { Grid as AbstractGrid } from "../Grid";
import { VisibleGrid, VisibleGridMixin } from "../VisibleGrid";

// documentation
export namespace SysName {
    // coord implementation from previous step

    // optional documentation
    export class Grid extends AbstractGrid<S> implements Required<Grid.Dimensions> {
        public static getAmbiguityThreshold(): <value> {
            return <value>;
        }
        public getSizeLimits(): AbstractGrid.DimensionBounds<S> { return this.SIZE_LIMITS; }
        private static readonly SIZE_LIMITS = Object.freeze({
            // fields from dimension type, except mapped to a frozen range description.
        });
        // field declarations
        // constructor
        // abstract method implementations

        // Note: I place the following abstract static methods at the
        // bottom because they are implementation-heavy and don't
        // control / describe the behaviour of the implementation at
        // such a core / logistical level.
        public static getSpawnCoords(
            playerCounts: TU.RoArr<number>,
            bounds: Required<Grid.Dimensions>,
        ): TU.RoArr<TU.RoArr<Coord.Bare>> {
            return undefined!;
        }
        public static getArea(dim: Grid.Dimensions): number {
            return undefined!;
        }
        public static getRandomCoord(bounds: Grid.Dimensions): Coord {
            return new Coord(undefined!);
        }
    }
    export namespace Grid {
        // if any fields are optional, describe how default values are chosen here.
        export type Dimensions = {
            // numeric fields.
            // at least one must be non-optional.
        };
    }
    JsUtils.protoNoEnum(Grid, ["_getTileAt", "_getTileDestsFrom", "_getTileSourcesTo"]);
    Object.freeze(Grid);
    Object.freeze(Grid.prototype);
}
Object.freeze(SysName);

/**
 */
// Separated for tree-shaking.
export class SysNameVisible extends Grid implements VisibleGrid<S> {
    public constructor(desc: AbstractGrid.CtorArgs<S>) {
        super(desc);
        // Set up DOM fields for rendering the grid.
    }
}
export interface SysNameVisible extends VisibleGridMixin<S> { };
JsUtils.applyMixins(SysNameVisible, [VisibleGridMixin]);
Object.freeze(SysNameVisible);
Object.freeze(SysNameVisible.prototype);
```

**In [`Grid.ts`](../Grid.ts)**

Import your system namespace, and add an entry to `Grid.Dimensions` for the new coordinate system, and register your grid system in [`PostInit.ts`](/src/base/game/PostInit.ts).
