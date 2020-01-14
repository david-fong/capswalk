import { Coord } from "./Coord";
import { Tile } from "./Tile";
import { Player } from "utils/TypeDefs";


type CoordSys = Coord.System.GridCapable;

type Arguments<S extends CoordSys> = [ Coord.Bare<S>, ] | [];

/**
 * A utility class to get destinations-to or sources-from a tile at
 * a specified coordinate. It is recommended to name the calling
 * variable "tile". A query starts with calling one of the methods
 * `at`, `destsFrom`, or `sourcesTo`. Optional filtering mutators
 * can be applied intermediately such as `unoccupied`. The query
 * ends with one of the getters `occupants` or `get`.
 * 
 * @template S
 * 
 * @template A
 * This allows `Source` implementations to accept a coordinate
 * specifier as an argument, such as is appropriate with a grid,
 * or to provide that information implicitly inside itself as
 * part of its spec, as is appropriate with a player.
 * 
 */
export class TileGetter<S extends CoordSys, A extends Arguments<S>> {

    public constructor(protected readonly source: TileGetter.Source<S,A>) { }

    public at(...args: A): Tile<S> {
        return this.source.__getTileAt(...args);
    }

    public destsFrom(...args: A): TileGetter.Query<S> {
        return new TileGetter.Query(this.source.__getTileDestsFrom(...args));
    }
    public sourcesTo(...args: A): TileGetter.Query<S> {
        return new TileGetter.Query(this.source.__getTileSourcesTo(...args));
    }

}



export namespace TileGetter {

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
    export class Query<S extends CoordSys> {

        public constructor(protected contents: ReadonlyArray<Tile<S>>) { }

        public get unoccupied(): Query<S> {
            this.contents = this.contents.filter((tile) => !tile.isOccupied);
            return this;
        }

        public get get(): ReadonlyArray<Tile<S>> {
            const retval = this.contents;
            delete this.contents;
            return retval;
        }

        public get occupants(): ReadonlyArray<Player<S>> {
            const retval = this.contents.map((tile) => );
            delete this.contents;
            return retval;
        }

    }

}
