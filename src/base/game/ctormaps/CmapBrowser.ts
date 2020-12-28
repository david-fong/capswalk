import { VisibleGrid } from "floor/visible/VisibleGrid";
import { Euclid2VisibleGrid } from "floor/impl/Euclid2/Visible";
import { BeehiveVisibleGrid } from "floor/impl/Beehive/Visible";

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