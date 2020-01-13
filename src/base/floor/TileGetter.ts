import { Coord } from "./Coord";
import { Tile } from "./Tile";


type CoordSys = Coord.System.GridCapable;

export namespace TileGetterParts {

    export interface Source<S extends CoordSys> {
        __getTileDestsFrom(coord: Coord.Bare<S>): ReadonlyArray<Tile<S>>;
        __getTileSourcesTo(coord: Coord.Bare<S>): ReadonlyArray<Tile<S>>;
    }

    export namespace Get {

        export interface Exposer<S extends CoordSys> {
            get: Exposed<S>;
            at(coord: Coord.Bare<S>): Tile<S>;
        }

        export interface Exposed<S extends CoordSys> {
            // Simple result-filter functions (take no arguments):
            unoccupied: Exposed<S>;

            // Call-chain-terminators:
            destsFrom(coord: Coord.Bare<S>): ReadonlyArray<Tile<S>>;
            sourcesTo(coord: Coord.Bare<S>): ReadonlyArray<Tile<S>>;
        }
    }

    type Filters = {
        occupancy: Tile.Occupancy;
    };

    export class _Impl<S extends CoordSys> implements Get.Exposer<S>, Get.Exposed<S> {

        protected readonly source: Source<S>;

        protected filters: Filters;

        public constructor(source: Source<S>) {
            this.source = source;
        }

        public get get(): Get.Exposed<S> {
            this.filters = Filters.NONE;
            return this;
        }

        public at(coord: Coord.Bare<S>): Tile<S> {
            return undefined!;
        }

        public destsFrom(coord: Coord.Bare<S>): ReadonlyArray<Tile<S>> {
            return undefined!;
        }
        public sourcesTo(coord: Coord.Bare<S>): ReadonlyArray<Tile<S>> {
            return undefined!;
        }

        public get unoccupied(): Get.Exposed<S> {
            this.filters.occupancy = Tile.Occupancy.UNOCCUPIED;
            return this;
        }

    }

}



export const TileGetter = TileGetterParts._Impl;
export type TileGetter<S extends CoordSys> = TileGetterParts.Get.Exposer<S>;
