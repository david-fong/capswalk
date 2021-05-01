import type { Coord } from "./Tile";
import type { Grid } from ":floor/Grid";
import { WrappedEuclid2 } from "./impl/Euclid2";
import { Beehive } from "./impl/Beehive";

export { Grid } from "./Grid";

// Each implementation must register itself into this dictionary.
// See CmapManager.ts.
const Dict: { readonly [S in Coord.System]: Grid.ClassIf<S> } = Object.freeze({
	// These are initialized later to avoid bootstrapping issues.
	[ "Euclid2" ]: WrappedEuclid2.Grid,
	[ "Beehive" ]: Beehive.Grid,
});

/**
 * @returns
 * A Grid class for the specified coordinate system, or undefined if
 * no such implementation exists.
 */
export const GetGridImpl = <S extends Coord.System>(coordSys: S): Grid.ClassIf<S> => {
	// Note: At the time of writing this, separating this into
	// two lines is necessary (otherwise Typescript will feel
	// overwhelmed)
	const ctor = Dict[coordSys];
	return ctor as unknown as Grid.ClassIf<S>;
};