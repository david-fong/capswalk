import { VisibleGrid } from "floor/VisibleGrid";
import { Euclid2VisibleGrid } from "floor/impl/Euclid2/Visible";
import { BeehiveVisibleGrid } from "floor/impl/Beehive/Visible";

/**
 */
export default (): void => {
	// Visible Grid Implementation Registry:
	const VGr = VisibleGrid;
	// @ts-expect-error : RO=
	VGr._Constructors
	= Object.freeze<typeof VGr._Constructors>({
		[ "W_EUCLID2" ]: Euclid2VisibleGrid,
		[ "BEEHIVE" ]: BeehiveVisibleGrid,
	});
	Object.freeze(VGr);
	// This is just an interface. There is no instance prototype to freeze.
};