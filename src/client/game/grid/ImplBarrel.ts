import type { Coord } from ":floor/Tile";
import type { Grid as BaseGrid } from ":floor/Grid";
import { Euclid2VisibleGrid } from "::game/grid/impl/Euclid2";
import { BeehiveVisibleGrid } from "::game/grid/impl/Beehive";

// Each implementation must register itself into this dictionary.
const Dict: { readonly [ S in Coord.System ]: BaseGrid.ClassIf<S> } = Object.freeze({
	[ "Euclid2" ]: Euclid2VisibleGrid,
	[ "Beehive" ]: BeehiveVisibleGrid,
});

/**
 * @returns
 * A Grid class for the specified coordinate system, or undefined if
 * no such implementation exists.
 */
export const GetVisibleGridImpl = <S extends Coord.System>(coordSys: S): BaseGrid.ClassIf<S> => {
	const ctor = Dict[coordSys];
	return ctor as unknown as BaseGrid.ClassIf<S>;
};