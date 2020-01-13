
# Flooring Implementation Guidelines

For the following guidelines, [`Euclid2`](./Euclid2.ts) can be used as a reference.

If the coordinate system of a new implementation is given some name `<sys_name>`, then a new file must be created in this folder with the name `SysName.ts`. The skeleton code required to integrate the new system into the codebase is as follows:

## Coordinate System

First, a new, unique enum entry for the new coordinate system must be defined in [Coord.System](../Coord.ts). This is the basis of how the rest of the codebase is able to refer to a coordinate system in a generic fashion.

**In `SysName.ts`**

```typescript
import { Coord as BaseCoord } from "../Coord";

// documentation
export namespace SysName {
    type B = Coord.Bare;
    type S = BaseCoord.System.SYSNAME;

    // optional documentation
    export class Coord extends BaseCoord.Abstract<S> implements B {
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
    ...
}
```

**In [`Coord.ts`](../Coord.ts)**

Import your system namespace, and add entries to `Coord` and `Coord.Bare` for the new coordinate system.

## Grid Implementation

**In `SysName.ts`**

```typescript
// coord-related imports
import { Tile } from "../Tile";
import { Grid as AbstractGrid } from "../Grid";

// documentation
export namespace SysName {
    // coord implementation from previous step

    // optional documentation
    export class Grid extends AbstractGrid<S> implements Required<Grid.Dimensions> {
        /**
         * @override
         */
        public static getAmbiguityThreshold(): <value> {
            return <value>;
        }
        /**
         * @override
         */
        public GET_SIZE_LIMITS(): AbstractGrid.DimensionBounds<S> { return Grid.SIZE_LIMITS; }
        private static readonly SIZE_LIMITS = Object.freeze({
            // fields from dimension type, except mapped to a frozen range description.
        });
        /**
         * @override
         */
        public static getSpawnCoords(
            playerCounts: Readonly<Record<Player.Operator, number>>,
            bounds: Required<Grid.Dimensions>,
        ): Player.Bundle<Coord.Bare> {
            return undefined!;
        }
        /**
         * @override
         */
        public static getRandomCoord(bounds: AbstractGrid.DimensionBounds<S>): Coord {
            return new Coord(undefined!);
        }
        // field declarations
        // constructor
        // abstract method implementations
    }
    export namespace Grid {
        // if any fields are optional, describe how default values are chosen here.
        export type Dimensions = {
            // numeric fields.
            // at least one must be non-optional.
        };
    }
}
```

**In [`Grid.ts`](../Grid.ts)**

Import your system namespace, and add entries to `Grid.Dimensions` and `Grid.Constructors` for the new coordinate system.
