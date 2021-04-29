import { VisibleGrid } from "./grid/VisibleGrid";
import { Euclid2VisibleGrid } from "::game/grid/impl/Euclid2";
import { BeehiveVisibleGrid } from "::game/grid/impl/Beehive";

/**
 */
export default (): void => {
	// Visible Grid Implementation Registry:
	const VGr = VisibleGrid;
	Object.freeze(Object.assign(VGr._Constructors, <typeof VGr._Constructors>{
		[ "W_EUCLID2" ]: Euclid2VisibleGrid,
		[ "BEEHIVE" ]: BeehiveVisibleGrid,
	}));
	Object.freeze(VGr);
	// This is just an interface. There is no instance prototype to freeze.
};