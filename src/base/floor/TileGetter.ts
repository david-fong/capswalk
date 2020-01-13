import { Coord } from "./Coord";
import { Tile } from "./Tile";
import { Player } from "utils/TypeDefs";


type CoordSys = Coord.System.GridCapable;

export namespace __TileGetterParts {

    /**
     * This allows `Source` implementations to accept a coordinate
     * specifier as an argument, such as is appropriate with a grid,
     * or to provide that information implicitly inside itself as
     * part of its spec, as is appropriate with a player.
     */
    export type Arguments<S extends CoordSys> = [ Coord.Bare<S>, ] | [];

    export interface Source<S extends CoordSys, A extends Arguments<S>> {
        __getTileAt(...args: A): Tile<S>;
        // NOTE: do we need to add an optional argument for range?
        // If so, document that it must default to `1` if unspecified.
        __getTileDestsFrom(...args: A): ReadonlyArray<Tile<S>>;
        __getTileSourcesTo(...args: A): ReadonlyArray<Tile<S>>;
    }

    /**
     * 
     */
    export namespace Get {

        export interface Exposer<S extends CoordSys, A extends Arguments<S>> {
            at(...args: A): Tile<S>;
            destsFrom(...args: A): Exposed<S>;
            sourcesTo(...args: A): Exposed<S>;
        }

        export interface Exposed<S extends CoordSys> {
            // Simple result-filter functions (take no arguments):
            unoccupied: Exposed<S>;

            // Call-chain-terminators:
            get: ReadonlyArray<Tile<S>>;
            occupants: ReadonlyArray<Player<S>>;
        }
    }

    /**
     * 
     */
    export class _Impl<S extends CoordSys, A extends Arguments<S>> implements Get.Exposer<S,A>, Get.Exposed<S> {

        protected readonly source: Source<S,A>;

        protected queryBuild: ReadonlyArray<Tile<S>>;

        public constructor(source: Source<S,A>) {
            this.source = source;
        }

        public at(...args: A): Tile<S> {
            return this.source.__getTileAt(...args);
        }

        public destsFrom(...args: A): Get.Exposed<S> {
            this.queryBuild = this.source.__getTileDestsFrom(...args);
            return this;
        }
        public sourcesTo(...args: A): Get.Exposed<S> {
            this.queryBuild = this.source.__getTileSourcesTo(...args);
            return this;
        }

        public get unoccupied(): Get.Exposed<S> {
            this.queryBuild = this.queryBuild.filter((tile) => !tile.isOccupied);
            return this;
        }

        public get get(): ReadonlyArray<Tile<S>> {
            const retval = this.queryBuild;
            delete this.queryBuild;
            return retval;
        }

        public get occupants(): ReadonlyArray<Player<S>> {
            const retval = this.queryBuild.map((tile) => );
            delete this.queryBuild;
            return retval;
        }

    }

}



/**
 * A utility class to get destinations-to or sources-from a tile at
 * a specified coordinate. It is recommended to name the calling
 * variable "tile". A query starts with calling one of the methods
 * `at`, `destsFrom`, or `sourcesTo`. Optional filtering mutators
 * can be applied intermediately such as `unoccupied`. The query
 * ends with one of the getters `occupants` or `get`.
 */
export const TileGetter = __TileGetterParts._Impl;
export type TileGetter<S extends CoordSys, A extends __TileGetterParts.Arguments<S>>
    = __TileGetterParts.Get.Exposer<S,A>;
